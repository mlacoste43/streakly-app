import { useEffect, useState } from 'react'
import { IconFlame, IconPlus, IconRun, IconBook, IconLanguage, IconUsers, IconTrophy, IconUserCircle, IconCheck, IconSnowflake, IconSettings, IconArrowRight, IconMoon, IconSun, IconLock, IconRefresh } from '@tabler/icons-react'
import { useSettings } from '../context/SettingsContext.jsx'
import { getUser } from '../telegram.js'
import WeekCalendar from '../components/WeekCalendar.jsx'
import { useDashboard } from '../redesign/useDashboard.js'
import { achievements, nextMilestone } from '../redesign/achievements.js'

const ICONS = { run: IconRun, book: IconBook, language: IconLanguage, users: IconUsers }
const NAV = [['today', 'Сегодня', IconFlame], ['together', 'Вместе', IconUsers], ['awards', 'Награды', IconTrophy], ['profile', 'Профиль', IconUserCircle]]
function initialTab() {
  try { const v = sessionStorage.getItem('streakly_tab'); return NAV.some(n => n[0] === v) ? v : 'today' } catch { return 'today' }
}
export default function MainScreen({ onOpenHabit, onCreateHabit, onOpenSettings }) {
  const dashboard = useDashboard()
  const { data, error, loading, pending, message, celebration, day, load, check } = dashboard
  const { theme, toggleTheme } = useSettings()
  const [tab, setTab] = useState(initialTab)
  const [filter, setFilter] = useState('all')
  const [awardFilter, setAwardFilter] = useState('all')
  const [reduced, setReduced] = useState(() => { try { return localStorage.getItem('streakly_reduced_motion') === 'true' } catch { return false } })
  useEffect(() => { try { sessionStorage.setItem('streakly_tab', tab) } catch {} }, [tab])
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'normal'
    try { localStorage.setItem('streakly_reduced_motion', String(reduced)) } catch {}
  }, [reduced])
  const habits = data?.habits ?? []
  const stats = data?.stats
  const awards = achievements(stats)
  const unlocked = awards.filter(a => a.unlocked)
  const nearest = awards.filter(a => !a.unlocked).sort((a, b) => b.value / b.target - a.value / a.target)[0]
  const calendars = data?.calendars ?? {}
  const known = habits.filter(h => calendars[h.id]?.ready).length
  const done = habits.filter(h => calendars[h.id]?.dates.includes(day)).length
  const ratio = habits.length ? done / habits.length : 0
  const visible = habits.filter(h => tab === 'together' ? h.type !== 'solo' : filter === 'all' || (filter === 'solo' ? h.type === 'solo' : h.type !== 'solo'))
  const user = data?.user ?? getUser() ?? {}
  const firstName = user.first_name || 'Друг'
  const allReady = known === habits.length && !!data && !loading
  function switchTab(value) { setTab(value); window.scrollTo({ top: 0, behavior: 'instant' }) }
  return (
    <div className="app-shell sr-app">
      <header className="sr-header">
        <button className="sr-brand" onClick={() => switchTab('today')} aria-label="Streakly — сегодня"><span><IconFlame size={24}/></span>streakly<span className="sr-brand-dot">.</span></button>
        <div className="sr-row">
          <button className="sr-icon" onClick={load} disabled={loading || pending !== null} aria-label="Обновить данные"><IconRefresh size={20}/></button>
          <button className="sr-avatar" onClick={() => switchTab('profile')} aria-label="Профиль">{user.photo_url ? <img src={user.photo_url} alt=""/> : firstName.slice(0, 1)}</button>
        </div>
      </header>
      <main className="sr-main">
        {error && <div className="sr-notice sr-error" role="alert">{error} <button onClick={load} disabled={loading}>Повторить</button></div>}
        {(tab === 'today' || tab === 'together') && <>
          <div className="sr-heading"><p className="sr-kicker">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>{tab === 'today' ? 'Твой ритм. Каждый день.' : 'Вместе легче.'}</h1><p>{tab === 'today' ? 'Не идеально. Просто ещё один шаг для себя.' : 'Поддержка друзей, а не соревнование.'}</p></div>
          <section className="sr-hero" aria-label="Личные отметки сегодня">
            <div><span className="sr-kicker">Личные отметки сегодня</span><h2>{!data ? 'Загружаем…' : !habits.length ? 'Начни с малого' : known !== habits.length ? 'Уточняем прогресс' : done === habits.length ? 'На сегодня всё!' : done + ' из ' + habits.length}</h2><p>{!habits.length ? 'Одна небольшая привычка — уже начало.' : done === habits.length && allReady ? 'Можно отдохнуть. Ты молодец.' : 'Каждая отметка имеет значение.'}</p><button className="sr-primary" onClick={onCreateHabit}><IconPlus size={18}/>Новая привычка</button></div>
            <div className="sr-ring" role="img" aria-label={done + ' личных отметок из ' + habits.length} style={{ '--progress': Math.round(ratio * 360) + 'deg' }}><div><IconFlame size={34}/><strong>{known === habits.length && data ? Math.round(ratio * 100) + '%' : '…'}</strong></div></div>
          </section>
          <div className="sr-section-head"><h2>{tab === 'together' ? 'Совместные привычки' : 'Твои привычки'}</h2><span>{visible.length}</span></div>
          {tab === 'today' && <div className="sr-filters" aria-label="Фильтр привычек">{[['all', 'Все'], ['solo', 'Личные'], ['shared', 'Вместе']].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>}
          {!data && loading && <div className="sr-skeleton" role="status">Загружаем привычки…</div>}
          {data && !visible.length && <section className="sr-empty"><IconFlame size={36}/><h3>{tab === 'together' ? 'Начните привычку вместе' : 'Здесь появится твой прогресс'}</h3><p>Выбери действие, которое легко повторить завтра.</p><button className="sr-primary" onClick={onCreateHabit}>Создать привычку</button></section>}
          <div className="sr-habit-grid">{visible.map(h => <HabitCard key={h.id} habit={h} calendar={calendars[h.id]} today={day} busy={pending !== null || loading} pending={pending === h.id} onCheck={() => check(h)} onOpen={() => onOpenHabit(h)}/>)}</div>
          {nearest && <button className="sr-next" onClick={() => switchTab('awards')}><span className="sr-medal"><IconTrophy size={24}/></span><span><small>Следующая награда</small><strong>{nearest.title}</strong><span>{nearest.value} / {nearest.target}</span></span><IconArrowRight size={21}/></button>}
        </>}

        {tab === 'awards' && <>
          <div className="sr-heading"><p className="sr-kicker">Коллекция маленьких побед</p><h1>Твои достижения</h1><p>{stats ? unlocked.length + ' из ' + awards.length + ' получено' : 'Статистика пока недоступна'}</p></div>
          {!stats && <div className="sr-notice">Не удалось получить статистику. Проверь обновление сервера и попробуй ещё раз.<button className="sr-outline" onClick={load} disabled={loading}>Обновить</button></div>}
          <div className="sr-filters">{[['all', 'Все'], ['unlocked', 'Получены'], ['locked', 'Впереди']].map(([key, label]) => <button key={key} aria-pressed={awardFilter === key} onClick={() => setAwardFilter(key)}>{label}</button>)}</div>
          <div className="sr-awards">{awards.filter(a => awardFilter === 'all' || (awardFilter === 'unlocked' ? a.unlocked : !a.unlocked)).map(a => <details className={'sr-award ' + (a.unlocked ? 'is-unlocked' : '')} key={a.id}>
            <summary><span className="sr-medal">{a.unlocked ? <IconTrophy size={28}/> : <IconLock size={24}/>}</span><small>{a.group}</small><h3>{a.title}</h3><span>{a.unlocked ? 'Получено' : Math.min(a.value, a.target) + ' / ' + a.target}</span><progress value={Math.min(a.value, a.target)} max={a.target} aria-label={a.title}/><small>Условие награды</small></summary><p>{a.rule}</p>
          </details>)}</div>
          <p className="sr-footnote">24 достижения рассчитываются по личным отметкам в доступных привычках. Удаление привычки удаляет её историю и может изменить коллекцию. Заморозки не заменяют выполненные действия. Награды не начисляют XP и не меняют правила стриков.</p>
        </>}
        {tab === 'profile' && <>
          <div className="sr-profile-head"><div className="sr-avatar sr-avatar-large">{user.photo_url ? <img src={user.photo_url} alt=""/> : firstName.slice(0, 1)}</div><h1>{firstName}</h1><p>{user.username ? '@' + user.username : 'В своём темпе. На своей стороне.'}</p></div>
          <div className="sr-stats">{[['Личных отметок', stats?.completed], ['Рекорд отметок подряд', stats?.bestStreak], ['Активных дней', stats?.activeDays], ['Получено наград', stats ? unlocked.length : undefined]].map(([label, value]) => <div key={label}><strong>{value ?? '—'}</strong><span>{label}</span></div>)}</div>
          <section className="sr-resource"><IconSnowflake size={28}/><div><h3>Заморозки</h3><p>Ресурс для сохранения серии по правилам сервера. Заморозка не считается выполнением.</p></div><strong>{data?.user?.streak_freezes ?? '—'}</strong></section>
          <div className="sr-preferences"><button onClick={toggleTheme}>{theme === 'dark' ? <IconSun size={22}/> : <IconMoon size={22}/>}<span>{theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}</span><IconArrowRight size={18}/></button><label><span>Уменьшить анимации</span><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)}/></label><button onClick={onOpenSettings}><IconSettings size={22}/><span>Настройки и уведомления</span><IconArrowRight size={18}/></button></div>
          <p className="sr-footnote">Здесь показана история личных выполнений, а не сумма рекордов. Общая серия команды в карточках рассчитывается существующим сервером.</p>
        </>}
      </main>
      <div className="sr-live" role="status" aria-live="polite" aria-atomic="true">{message && <span key={celebration}>{message}</span>}</div>
      <nav className="sr-nav" aria-label="Основная навигация">{NAV.map(([key, label, Icon]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => switchTab(key)}><Icon size={22}/><span>{label}</span></button>)}</nav>
    </div>
  )
}
function HabitCard({ habit: h, calendar: c, today, busy, pending, onCheck, onOpen }) {
  const Icon = ICONS[h.icon] ?? IconFlame
  const days = Math.max(0, Number(h.days) || 0)
  const target = nextMilestone(days)
  const done = !!c?.dates.includes(today)
  const members = c?.members
  const type = h.type === 'solo' ? 'Личная' : h.type === 'duo' ? 'Вдвоём' : 'Командная'
  return <article className={'sr-card ' + (done ? 'is-done' : '')}>
    <div className="sr-card-top"><span className={'sr-habit-icon sr-type-' + h.type}><Icon size={24}/></span><button className="sr-card-link" onClick={onOpen}><h3>{h.title}</h3><span>{type}{h.type !== 'solo' ? h.breakRule === 'personal' ? ' · личная серия' : ' · общая серия' : ''}</span></button><span className="sr-streak"><IconFlame size={17}/>{days}</span></div>
    <div className="sr-goal"><span>Следующая веха — {target}</span><strong>{days} / {target}</strong></div><progress value={days} max={target} aria-label="Прогресс серии до следующей вехи"/>
    <span className="sr-record">Рекорд серии: {Math.max(days, Number(h.record) || 0)}</span>
    {c?.ready ? <WeekCalendar checkedDates={c.dates} frozenDates={c.frozenDates} compact/> : <p className="sr-calendar-error">Календарь недоступен. Обнови данные.</p>}
    {h.type !== 'solo' && <div className="sr-team">{members ? <><div className="sr-avatars">{members.slice(0, 4).map(m => <span key={m.id} title={m.name + (m.done ? ' — готово сегодня' : ' — пока не отмечено')} className={m.done ? 'done' : ''}>{String(m.name || '?').slice(0, 1)}</span>)}</div><span>{members.filter(m => m.done).length} / {members.length} готовы</span></> : <span>Статусы участников недоступны</span>}<button onClick={onOpen} aria-label={'Открыть участников ' + h.title}><IconArrowRight size={20}/></button></div>}
    <div className="sr-card-bottom"><span>{done ? 'Шаг сделан' : 'В своём темпе'}</span><button className={done ? 'sr-completed' : 'sr-primary'} disabled={done || busy || !c?.ready} onClick={onCheck}>{done ? <><IconCheck size={18}/>Готово сегодня</> : pending ? 'Сохраняем…' : 'Отметить'}</button></div>
  </article>
}
