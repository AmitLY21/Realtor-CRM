import { Property, Lead, MatchScore, MatchMatrixResult } from '../types'
import { hebrewSimilarity, lookupNeighborhoodByStreet } from './geoRegistry'

export function calculateMatchScore(property: Property, lead: Lead): MatchScore {
  const disqualifyReasons: string[] = []

  // 1. Transaction Type Check (Must Match: sale with sale, rent with rent)
  if (property.transaction_type !== lead.transaction_type) {
    disqualifyReasons.push(
      property.transaction_type === 'sale' 
        ? 'הנכס למכירה אך הלקוח מחפש להשכרה' 
        : 'הנכס להשכרה אך הלקוח מחפש לרכישה'
    )
  }

  // 2. Hard Budget Filter (>10% above budget is immediately disqualified)
  const maxAllowedPrice = lead.max_budget * 1.10
  if (property.price > maxAllowedPrice) {
    disqualifyReasons.push(
      `מחיר הנכס (${property.price.toLocaleString()} ₪) חורג ביותר מ-10% מתקציב הלקוח (${lead.max_budget.toLocaleString()} ₪)`
    )
  }

  // 3. Mandatory Amenity Hard Filters
  if (lead.require_mamad && !property.has_mamad) {
    disqualifyReasons.push('חסר ממ״ד (חובה מבחינת הלקוח)')
  }
  if (lead.require_elevator && !property.has_elevator) {
    disqualifyReasons.push('חסרה מעלית (חובה מבחינת הלקוח)')
  }
  if (lead.require_balcony && !property.has_balcony) {
    disqualifyReasons.push('חסרה מרפסת שמש (חובה מבחינת הלקוח)')
  }
  if (lead.require_storage && !property.has_storage) {
    disqualifyReasons.push('חסר מחסן (חובה מבחינת הלקוח)')
  }
  if (lead.require_parking && property.parking_type === 'none') {
    disqualifyReasons.push('חסרה חניה (חובה מבחינת הלקוח)')
  }
  if (
    lead.require_parking && 
    lead.allowed_parking_types && 
    lead.allowed_parking_types.length > 0 &&
    !lead.allowed_parking_types.includes(property.parking_type)
  ) {
    disqualifyReasons.push('סוג החניה אינו תואם את העדפות הלקוח (למשל שלילת מכפיל)')
  }

  // 4. Location Match Check (Street-Smart & Fuzzy)
  let locationMatched = false
  // Check City match
  const cityMatch = lead.target_cities.length === 0 || lead.target_cities.some(tc => hebrewSimilarity(tc, property.city) > 0.8)

  if (cityMatch) {
    if (lead.target_neighborhoods.length === 0) {
      locationMatched = true
    } else {
      // Check direct neighborhood match
      const directNeighborMatch = lead.target_neighborhoods.some(tn => hebrewSimilarity(tn, property.neighborhood) > 0.8)
      if (directNeighborMatch) {
        locationMatched = true
      } else {
        // Street smart: does the street belong to any target neighborhood?
        const streetGuessedNeighbor = lookupNeighborhoodByStreet(property.street, property.city)
        if (streetGuessedNeighbor && lead.target_neighborhoods.some(tn => hebrewSimilarity(tn, streetGuessedNeighbor) > 0.8)) {
          locationMatched = true
        }
      }
    }
  }

  if (!locationMatched) {
    disqualifyReasons.push(`המיקום (${property.city}, ${property.neighborhood || property.street}) אינו באזורי היעד של הלקוח`)
  }

  // If hard disqualified, return score 0
  const isDisqualified = disqualifyReasons.length > 0
  if (isDisqualified) {
    return {
      property,
      lead,
      score: 0,
      isDisqualified: true,
      disqualifyReasons,
      breakdown: {
        priceScore: 0,
        roomsScore: 0,
        floorScore: 0,
        parkingScore: 0,
        featuresScore: 0
      }
    }
  }

  // --- SCORING ENGINE (Max 100 Points) ---

  // A. Price Fit (35 Points Max)
  let priceScore = 0
  if (property.price <= lead.max_budget) {
    priceScore = 35
  } else {
    // 0% to 10% over budget decays linearly from 35 down to 10 pts
    const overBudgetRatio = (property.price - lead.max_budget) / (lead.max_budget * 0.10)
    priceScore = Math.max(10, Math.round(35 - overBudgetRatio * 25))
  }

  // B. Room Match (25 Points Max)
  let roomsScore = 0
  if (property.rooms === lead.min_rooms || property.rooms === lead.min_rooms + 0.5) {
    roomsScore = 25
  } else if (property.rooms >= lead.min_rooms + 1.0) {
    roomsScore = 18 // Slightly more rooms than requested
  } else if (property.rooms >= lead.min_rooms) {
    roomsScore = 20
  } else {
    roomsScore = 5
  }

  // C. Floor Preference (15 Points Max)
  let floorScore = 10
  if (lead.preferred_floors.length === 0) {
    floorScore = 15
  } else if (lead.preferred_floors.includes(property.floor)) {
    floorScore = 15
  } else if (property.has_elevator) {
    floorScore = 12
  } else {
    floorScore = 6
  }

  // D. Parking & Legal Status (15 Points Max)
  let parkingScore = 8
  if (property.parking_type !== 'none') {
    if (property.parking_legal === 'tabu') {
      parkingScore = 15
    } else {
      parkingScore = 12
    }
  } else if (!lead.require_parking) {
    parkingScore = 10
  }

  // E. Bonus Features & Condition (10 Points Max)
  let featuresScore = 0
  if (property.has_mamad) featuresScore += 3
  if (property.has_balcony) featuresScore += 3
  if (property.has_storage) featuresScore += 2
  if (property.has_elevator) featuresScore += 2
  featuresScore = Math.min(10, featuresScore)

  const totalScore = Math.min(100, priceScore + roomsScore + floorScore + parkingScore + featuresScore)

  return {
    property,
    lead,
    score: totalScore,
    isDisqualified: false,
    disqualifyReasons: [],
    breakdown: {
      priceScore,
      roomsScore,
      floorScore,
      parkingScore,
      featuresScore
    }
  }
}

/**
 * Encapsulated Match Matrix Calculator
 * Computes all pairwise scores, hot matches (85%+), and ID count index maps in one pass.
 */
export function calculateMatchMatrix(properties: Property[], leads: Lead[]): MatchMatrixResult {
  const matches: MatchScore[] = []
  const propMap: Record<string, number> = {}
  const leadMap: Record<string, number> = {}

  for (const prop of properties) {
    if (prop.status !== 'active') continue
    for (const lead of leads) {
      if (lead.stage === 'closed_lost') continue
      const result = calculateMatchScore(prop, lead)
      if (!result.isDisqualified && result.score >= 50) {
        matches.push(result)
        if (result.score >= 70) {
          propMap[prop.id] = (propMap[prop.id] || 0) + 1
          leadMap[lead.id] = (leadMap[lead.id] || 0) + 1
        }
      }
    }
  }

  const hot = matches.filter(m => m.score >= 85)
  return {
    allMatches: matches,
    hotMatches: hot,
    propMatchesMap: propMap,
    leadMatchesMap: leadMap
  }
}
