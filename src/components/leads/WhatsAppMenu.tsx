import React from 'react'
import { MessageSquare } from 'lucide-react'

export type WhatsAppTemplateType = 'general' | 'showing' | 'price_drop' | 'deal_closed'

interface WhatsAppMenuProps {
  phone: string
  name: string
  isOpen: boolean
  onToggle: (e: React.MouseEvent) => void
  onClose: () => void
}

export const WhatsAppMenu: React.FC<WhatsAppMenuProps> = ({
  phone,
  name,
  isOpen,
  onToggle,
  onClose
}) => {
  const sendWhatsAppTemplate = (templateType: WhatsAppTemplateType) => {
    const cleanDigits = phone.replace(/\D/g, '')
    const intlPhone = cleanDigits.startsWith('0') ? '972' + cleanDigits.slice(1) : cleanDigits
    let text = ''

    switch (templateType) {
      case 'general':
        text = `היי ${name}, כאן המתווך שלך, מה שלומך? רציתי להתעדכן איך מתקדם החיפוש והאם עלו דרישות חדשות.`
        break
      case 'showing':
        text = `היי ${name}, התפנה מועד מתאים לסיור בנכס שמתאים בדיוק לפרופיל שלך. מתי נוח לך שנתאם היום או מחר?`
        break
      case 'price_drop':
        text = `היי ${name}, רציתי לעדכן אותך ראשון: יש ירידת מחיר משמעותית בנכס מבוקש באזור שלך! מתי נוח שנדבר?`
        break
      case 'deal_closed':
        text = `מזל טוב ${name}! שמחתי מאוד ללוות אותך בעסקה המוצלחת. מאחל המון ברכה והצלחה בבית החדש!`
        break
    }

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank')
    onClose()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
        title="שליחת הודעת וואטסאפ"
      >
        <MessageSquare className="w-3 h-3" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-1 w-52 rounded-xl bg-white border border-slate-200 p-1 shadow-xl z-50 text-right animate-in fade-in duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100">
            בחר נוסח וואטסאפ מהיר:
          </div>
          <button
            type="button"
            onClick={() => sendWhatsAppTemplate('general')}
            className="w-full text-right px-2 py-1.5 text-xs rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
          >
            👋 התעניינות כללית
          </button>
          <button
            type="button"
            onClick={() => sendWhatsAppTemplate('showing')}
            className="w-full text-right px-2 py-1.5 text-xs rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
          >
            🏡 תיאום סיור בנכס
          </button>
          <button
            type="button"
            onClick={() => sendWhatsAppTemplate('price_drop')}
            className="w-full text-right px-2 py-1.5 text-xs rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
          >
            📉 עדכון על ירידת מחיר
          </button>
          <button
            type="button"
            onClick={() => sendWhatsAppTemplate('deal_closed')}
            className="w-full text-right px-2 py-1.5 text-xs rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
          >
            🎉 ברכות על סגירת העסקה
          </button>
        </div>
      )}
    </div>
  )
}
