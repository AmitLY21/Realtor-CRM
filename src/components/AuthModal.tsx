import React, { useState } from 'react'
import { 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  KeyRound, 
  Users, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInWithEmail, signUpWithEmail } from '../lib/auth'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'signin' | 'signup' | 'join'
  onClose: () => void
  onSuccess: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'join'>(initialMode)
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          setErrorMsg('נא למלא אימייל וסיסמה.')
          setIsLoading(false)
          return
        }
        const res = await signInWithEmail(email, password)
        if (!res.success) {
          setErrorMsg(res.error || 'שגיאה בהתחברות. ודא שפרטי הכניסה נכונים.')
        } else {
          setSuccessMsg('התחברת בהצלחה!')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 600)
        }
      } else if (mode === 'signup') {
        if (!email || !password || !fullName) {
          setErrorMsg('נא למלא שם מלא, אימייל וסיסמה (לפחות 6 תווים).')
          setIsLoading(false)
          return
        }
        const res = await signUpWithEmail({
          email,
          password,
          fullName,
          phone,
          agencyName: agencyName.trim() || undefined
        })
        if (!res.success) {
          setErrorMsg(res.error || 'שגיאה בהרשמה.')
        } else {
          setSuccessMsg('ההרשמה הושלמה בהצלחה!')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 600)
        }
      } else if (mode === 'join') {
        if (!email || !password || !fullName || !inviteCode) {
          setErrorMsg('נא למלא את כל השדות וקוד ההזמנה של הצוות.')
          setIsLoading(false)
          return
        }
        const res = await signUpWithEmail({
          email,
          password,
          fullName,
          phone,
          inviteCode: inviteCode.trim().toUpperCase()
        })
        if (!res.success) {
          setErrorMsg(res.error || 'קוד ההזמנה שגוי או שלא נמצאה סוכנות מתאימה.')
        } else {
          setSuccessMsg('הצטרפת לצוות בהצלחה!')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 600)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'אירעה שגיאה בלתי צפויה.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md p-0 overflow-hidden" onClose={onClose}>
        {/* Modal Header */}
        <DialogHeader className="bg-slate-900 text-white p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-3">
            {mode === 'join' ? (
              <Users className="w-6 h-6 text-blue-400" />
            ) : mode === 'signup' ? (
              <Building2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {mode === 'signin' && 'התחברות למערכת Realtor CRM'}
            {mode === 'signup' && 'הרשמת סוכן / פתיחת צוות חדש'}
            {mode === 'join' && 'הצטרפות לצוות נדל״ן עם קוד'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs mt-1">
            {mode === 'signin' && 'התחבר כדי לסנכרן נכסים, לידים וקבוצות וואטסאפ בזמן אמת'}
            {mode === 'signup' && 'צור סביבת עבודה מאובטחת למשרד התיווך שלך'}
            {mode === 'join' && 'הזן את קוד ההזמנה שקיבלת מהסוכנות שלך להצטרפות מיידית'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null) }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'signin' 
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-white' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null) }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'signup' 
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-white' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            פתיחת צוות
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); setErrorMsg(null) }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'join' 
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold bg-white' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            הצטרפות עם קוד
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Join Mode: Invite Code */}
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">קוד הזמנה לצוות (6 תווים) *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="לדוגמה: A8F21B"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="pr-9 uppercase font-mono tracking-widest text-center text-sm"
                  required
                />
              </div>
            </div>
          )}

          {/* Full Name (Sign Up / Join) */}
          {(mode === 'signup' || mode === 'join') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">שם מלא של הסוכן *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ישראל ישראלי"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pr-9 text-sm"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">כתובת אימייל *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <Input
                type="email"
                placeholder="agent@agency.co.il"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-9 text-sm text-left dir-ltr"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">סיסמה *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-9 text-sm text-left dir-ltr"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Phone (Sign Up / Join) */}
          {(mode === 'signup' || mode === 'join') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">טלפון נייד בוואטסאפ</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <Input
                  type="tel"
                  placeholder="050-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pr-9 text-sm text-left dir-ltr"
                />
              </div>
            </div>
          )}

          {/* Agency Name (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">שם משרד / צוות תיווך</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="פריים נדל״ן תל אביב"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="pr-9 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">אם תשאירו ריק, תשוייכו לצוות המרכזי הקיים במערכת.</p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' && 'התחבר למערכת'}
              {mode === 'signup' && 'צור חשבון והקם צוות'}
              {mode === 'join' && 'הצטרף לצוות הסוכנות'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
