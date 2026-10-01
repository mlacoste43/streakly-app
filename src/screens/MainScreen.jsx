import { useEffect, useState } from 'react'
import { IconFlame, IconSettings, IconPlus, IconRun, IconLanguage, IconBook, IconUsers, IconTargetArrow } from '@tabler/icons-react'
import StreakCard from '../components/StreakCard.jsx'
import { api } from '../api.js'
import { useSettings } from '../context/SettingsContext.jsx'

const ICONS = { run: IconRun, language: IconLanguage, book: IconBook, users: IconUsers }

export default function MainScreen({ onOpenHabit, onCreateHabit, onOpenSettings }) {
  const { t, language } = useSettings()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('all')
  const [checkingId, setCheckingId] = useState(null)

  useEffect(() => {
    let active = true
    api.getHabits()
      .then((data) => { if (active) setHabits(data.habits ?? []) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handleCheckIn(habit) {
    if (checkingId != null) return
    setCheckingId(habit.id)
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      setHabits((prev) => prev.map((h) => h.id === updated.id ? updated : h))
    } catch (err) {
      alert(err.message)
    } finally {
      setCheckingId(null)
    }
  }

  function subtitleFor(h) {
    if (h.type === 'duo') return `${t('duoWith')} ${h.partner ?? 'вЂ¦'}`
    if (h.type === 'team') return t('team')
    if (h.deadlineHours) return `${t('solo')} В· ${t('hoursLeft')} ${h.deadlineHours} ${t('hoursShort')}`
    return t('solo')
  }

  const collective = habits.filter((h) => h.type === 'duo' || h.type === 'team')
  const visible = tab === 'together' ? collective : habits
  const safeCount = habits.filter((h) => !h.deadlineHours).length
  const totalDays = habits.reduce((sum, h) => sum + (Number(h.days) || 0), 0)
  const dateLabel = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">вњі</span><span>С€Р°РіР°Р№</span></div>
        <div className="tagline">Р’РњР•РЎРўР• Р›Р•Р“Р§Р•</div>
        <nav className="side-nav" aria-label="Р Р°Р·РґРµР»С‹">
          <button className={`nav-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')} aria-current={tab === 'all' ? 'page' : undefined}>рџЏЃ <span>{language === 'ru' ? 'Р§РµР»Р»РµРЅРґР¶Рё' : 'Challenges'}</span></button>
          <button className={`nav-btn ${tab === 'together' ? 'active' : ''}`} onClick={() => setTab('together')} aria-current={tab === 'together' ? 'page' : undefined}>рџ‘‹ <span>{language === 'ru' ? 'РЎРѕРІРјРµСЃС‚РЅС‹Рµ' : 'Together'}</span></button>
          <button className="nav-btn" onClick={onOpenSettings}>вљ™пёЏ <span>{t('settings')}</span></button>
        </nav>
        <div className="sidebar-note"><strong>{language === 'ru' ? 'РњР°Р»РµРЅСЊРєРёРµ С€Р°РіРё вЂ” Р±РѕР»СЊС€РёРµ РїРµСЂРµРјРµРЅС‹.' : 'Small steps, big changes.'}</strong><p>{language === 'ru' ? 'РћС‚РјРµС‡Р°Р№СЃСЏ РєР°Р¶РґС‹Р№ РґРµРЅСЊ. Р’РјРµСЃС‚Рµ Р»РµРіС‡Рµ!' : 'Check in every day. Better together!'}</p></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="eyebrow">{dateLabel}</span>
          <div className="top-actions">
            <span className="pill" title={t('totalFireDays')}>рџ”Ґ {totalDays}</span>
            <button className="tile-btn" onClick={onOpenSettings} aria-label={t('settings')}><IconSettings size={20} /></button>
          </div>
        </header>
        <section className="hero">
          <div className="hero-copy">
            <span className="badge">{t('heroBadge')}</span>
            <h1>{t('heroTitle1')}<br />{t('heroTitle2')}</h1>
            <p>{t('heroText')}</p>
            <button className="btn" onClick={onCreateHabit}><IconPlus size={19} />{t('newHabit')}</button>
          </div>
          <div className="mascot" aria-hidden="true"><span>рџђё</span><small>{language === 'ru' ? 'РўС‹ СЃРјРѕР¶РµС€СЊ!' : 'You got this!'}</small></div>
        </section>

        <div className="dashboard-grid">
          <section className="habits-section">
            <div className="section-head"><h2>{tab === 'together' ? (language === 'ru' ? 'РЎРѕРІРјРµСЃС‚РЅС‹Рµ С‡РµР»Р»РµРЅРґР¶Рё' : 'Together') : t('yourHabits')}</h2><span className="small-muted">{visible.length} {t('totalCount')}</span></div>
            {loading && <div className="card-ng status-card" role="status">{t('loading')}</div>}
            {error && <div className="card-ng status-card error" role="alert">{t('loadError')}: {error}</div>}
            {!loading && !error && visible.length === 0 && <div className="card-ng status-card">{tab === 'together' ? (language === 'ru' ? 'РЎРѕР·РґР°Р№ РїСЂРёРІС‹С‡РєСѓ РґР»СЏ РґРІРѕРёС… РёР»Рё РєРѕРјР°РЅРґС‹ рџЊ±' : 'Create a duo or team challenge рџЊ±') : t('emptyHabits')}</div>}
            <div className="habits-grid">
              {visible.map((h) => <StreakCard key={h.id} icon={ICONS[h.icon] ?? IconFlame} title={h.title} subtitle={subtitleFor(h)} days={h.days} record={h.record} variant={h.variant} needsCheckIn={Boolean(h.deadlineHours)} checkingIn={checkingId === h.id} people={h.type === 'duo' && h.partner ? [h.partner] : []} onCheckIn={() => handleCheckIn(h)} onOpen={() => onOpenHabit?.(h)} />)}
            </div>
          </section>
          <aside className="dashboard-rail">
            <section className="card-ng plan-card"><h3>рџЋЇ {t('planToday')}</h3><p className="small-muted">{habits.length > 0 && safeCount === habits.length ? t('planAllDone') : t('planKeepGoing')}</p><div className="daily-count">{safeCount} <span>/ {habits.length}</span></div><div className="track" role="progressbar" aria-label={t('planToday')} aria-valuemin={0} aria-valuemax={habits.length} aria-valuenow={safeCount}><div className="fill" style={{ width: `${habits.length ? safeCount / habits.length * 100 : 0}%` }} /></div></section>
            <section className="card-ng together-card"><h3><IconTargetArrow size={22} /> {language === 'ru' ? 'Р’РјРµСЃС‚Рµ РІРµСЃРµР»РµРµ' : 'Better together'}</h3><p className="small-muted">{language === 'ru' ? 'РџСЂРёРІС‹С‡РєРё СЃ РїР°СЂС‚РЅС‘СЂРѕРј Рё РєРѕРјР°РЅРґРѕР№' : 'Habits with partners and teams'}</p><div className="daily-count">{collective.length}</div><button className="btn secondary" onClick={() => setTab('together')}>{language === 'ru' ? 'РЎРјРѕС‚СЂРµС‚СЊ СЃРѕРІРјРµСЃС‚РЅС‹Рµ' : 'See together'}</button></section>
            <section className="tip-card"><h3>рџ’њ {t('tipTitle')}</h3><p>{t('tipText')}</p></section>
          </aside>
        </div>
      </main>
    </div>
  )
}