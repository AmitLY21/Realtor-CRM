import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  dismissIncomingListing,
  deleteIncomingListing,
  addIncomingListing,
  markIncomingListingImported,
  updatePropertyPrice,
  cleanQueueDuplicates
} from '../lib/db'
import { WhatsAppIncomingListing } from '../types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  Users,
  User,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  EyeOff,
  CheckCircle2,
  MapPin,
  Building,
  RotateCcw,
  Inbox,
  Download,
  ExternalLink,
  HelpCircle
} from 'lucide-react'

interface IncomingListingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onImportListing: (listing: WhatsAppIncomingListing) => void
}

type FilterStatus = 'pending' | 'imported' | 'dismissed' | 'all'

function formatRelativeTimeHebrew(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'הרגע'
  if (diffMin < 60) return `לפני ${diffMin} דק׳`
  if (diffHours < 24) return `לפני ${diffHours} שע׳`
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  return new Date(timestamp).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getConfidenceBadge(score: number) {
  if (score >= 70) {
    return {
      label: `דיוק גבוה (${score}%)`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  } else if (score >= 40) {
    return {
      label: `דיוק בינוני (${score}%)`,
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  } else {
    return {
      label: `דיוק נמוך (${score}%)`,
      className: 'bg-orange-50 text-orange-700 border-orange-200'
    }
  }
}

export const IncomingListingsDrawer: React.FC<IncomingListingsDrawerProps> = ({
  isOpen,
  onClose,
  onImportListing
}) => {
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [showSetupGuide, setShowSetupGuide] = useState(false)

  // Fetch all incoming listings ordered newest first
  const allListings = useLiveQuery(
    () => db.incoming_listings.orderBy('receivedAt').reverse().toArray(),
    [],
    [] as WhatsAppIncomingListing[]
  )

  const counts = {
    pending: allListings.filter(l => l.status === 'pending').length,
    imported: allListings.filter(l => l.status === 'imported').length,
    dismissed: allListings.filter(l => l.status === 'dismissed').length,
    all: allListings.length
  }

  const filteredListings = allListings.filter(listing => {
    if (filter === 'all') return true
    return listing.status === filter
  })

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDismiss = async (id: string) => {
    await dismissIncomingListing(id)
  }

  const handleDelete = async (id: string) => {
    await deleteIncomingListing(id)
  }

  const handleRestore = async (listing: WhatsAppIncomingListing) => {
    await addIncomingListing({ ...listing, status: 'pending' })
  }

  const renderSetupGuide = () => (
    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex flex-col gap-2.5 text-slate-700 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-100">
        <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
          <Sparkles className="size-3.5 text-emerald-600" />
          מדריך חיבור תוסף וואטסאפ (Setup Guide)
        </span>
        <a
          href="/realtor-crm-whatsapp-companion.zip"
          download="realtor-crm-whatsapp-companion.zip"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="size-3.5" />
          <span>הורד תוסף (ZIP)</span>
        </a>
      </div>

      <div className="space-y-2 text-[11px] leading-relaxed">
        <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
          <p className="font-bold text-slate-900 mb-1 text-xs">
            1. הורדת התוסף וחילוץ (Download &amp; Unzip):
          </p>
          <p className="text-slate-600">
            הורד את קובץ ה-ZIP של התוסף וחלץ אותו לתיקייה נוחה במחשב שלך (למשל בהורדות או במסמכים).
          </p>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
          <p className="font-bold text-slate-900 mb-1 text-xs">
            2. טעינת התוסף בדפדפן (Load in Chrome / Edge):
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-1">
            <li>נווט לכתובת <code className="bg-slate-100 px-1 rounded text-slate-800 font-mono">chrome://extensions/</code> (ב-Chrome) או <code className="bg-slate-100 px-1 rounded text-slate-800 font-mono">edge://extensions/</code> (ב-Edge).</li>
            <li>הפעל את מתג <strong>"Developer mode" (מצב מפתח)</strong> בפינה העליונה.</li>
            <li>לחץ על <strong>"Load unpacked" (טען תוסף לא ארוז)</strong> ובחר את התיקייה שחולצה מקובץ ה-ZIP.</li>
          </ul>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
          <p className="font-bold text-slate-900 mb-1 text-xs">
            3. התחלת ניטור בקבוצות (Start Monitoring):
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-1">
            <li>
              פתח את{' '}
              <a
                href="https://web.whatsapp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline font-semibold hover:text-emerald-800 inline-flex items-center gap-0.5"
              >
                WhatsApp Web <ExternalLink className="size-2.5" />
              </a>{' '}
              והיכנס לכל קבוצת נדל״ן או שת״פ מתווכים.
            </li>
            <li>לחץ על הכפתור הירוק <strong>"סנכרן ל-CRM"</strong> בראש הצ׳אט.</li>
            <li>הודעות נכסים חדשות ייקלטו אוטומטית במערכת ה-CRM עם תגית מונה חיה בראש המסך!</li>
          </ul>
        </div>
      </div>
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col h-full bg-slate-50 text-foreground"
        onClose={onClose}
      >
        {/* Drawer Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-border bg-white text-right shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base sm:text-lg font-bold">
                    מודעות וואטסאפ נכנסות
                  </SheetTitle>
                  {counts.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse">
                      {counts.pending} חדשות
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  קליטה ובקרה חכמה מקבוצות וואטסאפ לסקירה וייבוא מהיר
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  showSetupGuide
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
                title="מדריך חיבור תוסף וואטסאפ"
              >
                <HelpCircle className="size-3.5" />
                <span>מדריך חיבור</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 overflow-x-auto pb-1">
            <button
              onClick={() => setFilter('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>ממתינים</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === 'pending' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setFilter('imported')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === 'imported'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>יובאו</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === 'imported' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {counts.imported}
              </span>
            </button>

            <button
              onClick={() => setFilter('dismissed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === 'dismissed'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>נדחו</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === 'dismissed' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {counts.dismissed}
              </span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>הכל</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {counts.all}
              </span>
            </button>

            {counts.pending > 1 && (
              <button
                type="button"
                onClick={async () => {
                  const removed = await cleanQueueDuplicates()
                  if (removed > 0) {
                    alert(`נוקו ${removed} מודעות כפולות מהתור בהצלחה!`)
                  } else {
                    alert('לא נמצאו מודעות כפולות בתור הממתינים.')
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors mr-auto shrink-0 cursor-pointer"
                title="איחוד וניקוי מודעות כפולות בתור הממתינים"
              >
                <Sparkles className="size-3 text-amber-600" />
                <span>נקה כפילויות בתור</span>
              </button>
            )}
          </div>
        </SheetHeader>

        {/* Listings Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3">
          {showSetupGuide && renderSetupGuide()}

          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center text-muted-foreground my-auto gap-4">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
                  <Inbox className="size-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  {filter === 'pending'
                    ? 'אין מודעות ממתינות לסקירה'
                    : 'אין מודעות בקטגוריה זו'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  {filter === 'pending'
                    ? 'מודעות חדשות שייקלטו על-ידי תוסף הוואטסאפ מקבוצות מנוטרות יוצגו כאן באופן מיידי.'
                    : 'רשימת המודעות המסוננת ריקה כעת.'}
                </p>
              </div>

              {!showSetupGuide && filter === 'pending' && (
                <div className="w-full text-right mt-2">
                  {renderSetupGuide()}
                </div>
              )}
            </div>
          ) : (
            filteredListings.map(listing => {
              const draft = listing.parsedDraft
              const confidence = getConfidenceBadge(draft.confidenceScore)
              const isExpanded = Boolean(expandedCards[listing.id])

              // Features tags
              const features = [
                draft.has_mamad ? 'ממ״ד' : null,
                draft.has_elevator ? 'מעלית' : null,
                draft.has_balcony ? 'מרפסת' : null,
                draft.parking_type !== 'none' ? 'חניה' : null
              ].filter(Boolean)

              return (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3 text-right"
                >
                  {/* Card Top: Group Title, Sender, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                        <Users className="size-3 text-emerald-600" />
                        {listing.groupTitle}
                      </span>

                      {listing.repostCount && listing.repostCount > 1 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold"
                          title={listing.repostGroups?.join(', ')}
                        >
                          <RotateCcw className="size-3 text-blue-500" />
                          פורסם ב-{listing.repostCount} קבוצות
                        </span>
                      )}

                      {(listing.senderName || listing.senderPhone) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          <User className="size-3 text-slate-500" />
                          {listing.senderName || listing.senderPhone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="size-3 text-slate-400" />
                        {formatRelativeTimeHebrew(listing.receivedAt)}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${confidence.className}`}
                      >
                        {confidence.label}
                      </span>
                    </div>
                  </div>

                  {/* Duplicate Warning Banner */}
                  {listing.duplicateOfPropertyId && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-tight flex-1">
                          <span className="font-bold text-amber-900">
                            שים לב: זוהה נכס קיים עם מאפיינים זהים במערכת
                          </span>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            כתובת במאגר:{' '}
                            <span className="font-semibold underline">
                              {listing.duplicateOfPropertyAddress || 'אותרה התאמה בנכסים הפעילים'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {listing.existingPropertyPrice && draft.price && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/80 border border-amber-200/60 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span>מחיר במאגר: <strong>{listing.existingPropertyPrice.toLocaleString()} ₪</strong></span>
                            <span>⬅️</span>
                            <span>מחיר במודעה: <strong className="text-emerald-700">{draft.price.toLocaleString()} ₪</strong></span>
                          </div>

                          {listing.priceDifference !== undefined && listing.priceDifference < 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              📉 ירידת מחיר של {Math.abs(listing.priceDifference).toLocaleString()} ₪!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Direct actions for duplicate */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {listing.priceDifference !== undefined && listing.priceDifference < 0 && draft.price && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updatePropertyPrice(
                                listing.duplicateOfPropertyId!,
                                draft.price!,
                                `ירידת מחיר זוהתה מוואטסאפ מקבוצת ${listing.groupTitle}`
                              )
                              await markIncomingListingImported(listing.id)
                              alert('מחיר הנכס עודכן בהצלחה במאגר והמודעה סומנה כיובאה!')
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                          >
                            עדכן מחיר בנכס במאגר ({draft.price.toLocaleString()} ₪)
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDismiss(listing.id)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          כבר במאגר - הסר כפילות
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Chips Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {/* Location */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="size-2.5" /> מיקום
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {draft.street
                          ? `${draft.street} ${draft.house_number || ''}`.trim()
                          : 'רחוב לא צוין'}
                        {draft.city ? `, ${draft.city}` : ''}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] text-slate-400">מחיר מבוקש</span>
                      <span className="font-bold text-emerald-700">
                        {draft.price ? `${draft.price.toLocaleString()} ₪` : 'לא צוין'}
                      </span>
                    </div>

                    {/* Rooms & Floor */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] text-slate-400">חדרים וקומה</span>
                      <span className="font-bold text-slate-800">
                        {draft.rooms ? `${draft.rooms} חד׳` : '-'}
                        {draft.floor !== undefined ? ` • קומה ${draft.floor}` : ''}
                      </span>
                    </div>

                    {/* Sqm */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] text-slate-400">שטח בנוי</span>
                      <span className="font-bold text-slate-800">
                        {draft.sqm ? `${draft.sqm} מ״ר` : 'לא צוין'}
                      </span>
                    </div>

                    {/* Property Type */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] text-slate-400">סוג נכס</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Building className="size-3 text-slate-400" />
                        {draft.transaction_type === 'rent' ? 'להשכרה' : 'למכירה'} (
                        {draft.property_type === 'penthouse'
                          ? 'פנטהאוז'
                          : draft.property_type === 'garden_apartment'
                          ? 'דירת גן'
                          : draft.property_type === 'duplex'
                          ? 'דופלקס'
                          : draft.property_type === 'detached'
                          ? 'קוטג׳/פרטי'
                          : 'דירה'}
                        )
                      </span>
                    </div>

                    {/* Features Chips */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                      <span className="text-[10px] text-slate-400">מאפיינים נוספים</span>
                      <span className="font-bold text-slate-700 truncate">
                        {features.length > 0 ? features.join(', ') : 'ללא תוספות'}
                      </span>
                    </div>
                  </div>

                  {/* Raw Text Expandable Section */}
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(listing.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3.5" />
                          <span>הסתר טקסט הודעת מקור מוואטסאפ</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3.5" />
                          <span>הצג טקסט הודעת מקור מוואטסאפ</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-700 text-xs whitespace-pre-wrap font-sans leading-relaxed select-text animate-in fade-in duration-100">
                        {listing.rawText}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {listing.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => onImportListing(listing)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 h-8 px-3 rounded-lg"
                        >
                          <Sparkles className="size-3.5" />
                          <span>ייבא לנכסים (Review &amp; Import)</span>
                        </Button>
                      )}

                      {listing.status === 'imported' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          נכס יובא למאגר
                        </span>
                      )}

                      {listing.status === 'dismissed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(listing)}
                          className="text-xs gap-1.5 h-8 px-2.5 text-slate-700"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>החזר לממתינים</span>
                        </Button>
                      )}

                      {listing.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(listing.id)}
                          className="text-slate-500 hover:text-slate-800 text-xs gap-1 h-8 px-2.5"
                          title="התעלם ממודעה זו"
                        >
                          <EyeOff className="size-3.5" />
                          <span>התעלם (Dismiss)</span>
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(listing.id)}
                      className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="מחק לצמיתות"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">מחק</span>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
