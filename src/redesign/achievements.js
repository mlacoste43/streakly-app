export const milestones = [3, 7, 14, 21, 30, 60, 100, 180, 365]
export function nextMilestone(days) {
  return milestones.find(n => n > days) ?? (Math.floor(days / 100) + 1) * 100
}
export function achievements(stats) {
  if (!stats) return []
  const make = (id, title, group, field, target, rule) => ({
    id, title, group, target, rule,
    value: Math.max(0, Number(stats[field]) || 0),
    unlocked: Number(stats[field]) >= target,
  })
  return [
    ...milestones.map(n => make('streak-' + n, n + ' дней в ритме', 'Стрики', 'bestStreak', n,
      'Отметить одну привычку ' + n + ' календарных дней подряд. Заморозка не считается выполнением.')),
    ...[1, 10, 25, 50, 100, 250, 500].map(n => make('done-' + n, n === 1 ? 'Первый шаг' : n + ' маленьких побед', 'Регулярность', 'completed', n,
      'Сделать ' + n + ' личных отметок во всех привычках.')),
    make('week-5', 'Своя неделя', 'Регулярность', 'bestWeek', 5, 'Быть активным в 5 разных днях одной недели, с понедельника по воскресенье.'),
    make('week-7', 'Неделя в движении', 'Регулярность', 'bestWeek', 7, 'Хотя бы одна личная отметка каждый день одной календарной недели.'),
    make('month-20', 'Месяц заботы', 'Регулярность', 'bestMonth', 20, 'Отметить привычки в 20 разных днях одного календарного месяца.'),
    ...[1, 10, 30, 100].map(n => make('shared-' + n, n === 1 ? 'Первый шаг вместе' : n + ' шагов вместе', 'Вместе', 'sharedCompleted', n,
      'Сделать ' + n + ' собственных отметок в совместных привычках. Это не число совместных дней.')),
    make('return', 'Снова в ритме', 'Возвращение', 'comebacks', 1, 'Вернуться к той же привычке после хотя бы одного дня без отметки. Каждый новый шаг важен.'),
  ]
}
