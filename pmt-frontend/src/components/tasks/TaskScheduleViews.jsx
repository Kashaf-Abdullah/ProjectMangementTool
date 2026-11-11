import React, { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks
} from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'In Review',
  done: 'Done'
};

const statusColors = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981'
};

const readDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date
    ? value
    : typeof value === 'string'
      ? parseISO(value.slice(0, 10))
      : new Date(value);
  return isValid(date) ? date : null;
};

const getTaskRange = (task) => {
  const start = readDate(task.startDate) || readDate(task.dueDate);
  const end = readDate(task.dueDate) || start;
  if (!start || !end) return null;
  return end < start ? { start: end, end: start } : { start, end };
};

const getTaskProject = (task, projects) => (
  typeof task.projectId === 'object' && task.projectId !== null
    ? task.projectId
    : projects.find((project) => project._id === task.projectId)
);

const getTaskAssignee = (task, members) => (
  typeof task.assigneeId === 'object' && task.assigneeId !== null
    ? task.assigneeId
    : members.find((member) => member._id === task.assigneeId)
);

const TaskScheduleViews = ({ viewMode, tasks, projects, members, onSelectTask }) => {
  const [calendarMode, setCalendarMode] = useState('month');
  const [timelineMode, setTimelineMode] = useState('weeks');
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const calendarDays = useMemo(() => {
    if (calendarMode === 'week') {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
    }

    const monthStart = startOfMonth(anchorDate);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
    });
  }, [anchorDate, calendarMode]);

  const calendarTasks = useMemo(() => tasks.filter((task) => getTaskRange(task)), [tasks]);
  const unscheduledTasks = useMemo(() => tasks.filter((task) => !getTaskRange(task)), [tasks]);
  const timeline = useMemo(() => {
    const start = timelineMode === 'weeks'
      ? startOfWeek(anchorDate, { weekStartsOn: 1 })
      : startOfMonth(anchorDate);
    const end = timelineMode === 'weeks'
      ? addDays(start, 13)
      : endOfMonth(addMonths(start, 5));
    const days = eachDayOfInterval({ start, end });
    const months = [];
    days.forEach((day) => {
      const key = format(day, 'yyyy-MM');
      const currentMonth = months[months.length - 1];
      if (!currentMonth || currentMonth.key !== key) {
        months.push({ key, date: day, days: 1 });
      } else {
        currentMonth.days += 1;
      }
    });
    return { start, end, days, months };
  }, [anchorDate, timelineMode]);

  const navigate = (direction) => {
    if (viewMode === 'calendar') {
      setAnchorDate((date) => calendarMode === 'week'
        ? (direction < 0 ? subWeeks(date, 1) : addWeeks(date, 1))
        : (direction < 0 ? subMonths(date, 1) : addMonths(date, 1)));
      return;
    }

    setAnchorDate((date) => timelineMode === 'weeks'
      ? (direction < 0 ? subWeeks(date, 2) : addWeeks(date, 2))
      : (direction < 0 ? subMonths(date, 6) : addMonths(date, 6)));
  };

  const getRangeLabel = () => {
    if (viewMode === 'calendar' && calendarMode === 'week') {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`;
    }
    if (viewMode === 'calendar') return format(anchorDate, 'MMMM yyyy');
    if (timelineMode === 'weeks') {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} – ${format(addDays(start, 13), 'MMM d, yyyy')}`;
    }
    return `${format(startOfMonth(anchorDate), 'MMM yyyy')} – ${format(addMonths(startOfMonth(anchorDate), 5), 'MMM yyyy')}`;
  };

  const renderTaskButton = (task, compact = false) => {
    const project = getTaskProject(task, projects);
    const assignee = getTaskAssignee(task, members);
    const dueDate = readDate(task.dueDate);
    return (
      <button
        key={task._id}
        type="button"
        className={`schedule-task ${compact ? 'compact' : ''}`}
        style={{ '--task-color': statusColors[task.status] || statusColors.todo }}
        onClick={() => onSelectTask(task)}
        title={`${task.title} · ${statusLabels[task.status] || task.status}${dueDate ? ` · Due ${format(dueDate, 'MMM d')}` : ''}`}
      >
        <span className="schedule-task-title">{task.title}</span>
        {!compact && (
          <span className="schedule-task-meta">
            {project?.name || 'Unlinked project'}
            {assignee ? ` · ${assignee.firstName} ${assignee.lastName}` : ''}
          </span>
        )}
      </button>
    );
  };

  const renderUnscheduled = () => (
    unscheduledTasks.length > 0 && (
      <section className="schedule-unscheduled">
        <div>
          <h3>Unscheduled tasks</h3>
          <p>Set a start or due date to place these tasks on the schedule.</p>
        </div>
        <div className="schedule-unscheduled-list">
          {unscheduledTasks.map((task) => renderTaskButton(task, true))}
        </div>
      </section>
    )
  );

  if (viewMode === 'calendar') {
    return (
      <section className="schedule-view" aria-label="Task calendar">
        <div className="schedule-toolbar">
          <div className="schedule-navigation">
            <button type="button" className="schedule-nav-button" onClick={() => navigate(-1)} aria-label="Previous period">
              <FiChevronLeft />
            </button>
            <h2>{getRangeLabel()}</h2>
            <button type="button" className="schedule-nav-button" onClick={() => navigate(1)} aria-label="Next period">
              <FiChevronRight />
            </button>
            <button type="button" className="schedule-today-button" onClick={() => setAnchorDate(new Date())}>Today</button>
          </div>
          <div className="schedule-mode-toggle" aria-label="Calendar range">
            {['week', 'month'].map((mode) => (
              <button
                type="button"
                key={mode}
                className={calendarMode === mode ? 'active' : ''}
                onClick={() => setCalendarMode(mode)}
              >
                {mode === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>

        <div className={`calendar-grid ${calendarMode === 'week' ? 'weekly' : ''}`}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div className="calendar-weekday" key={day}>{day}</div>
          ))}
          {calendarDays.map((day) => {
            const dayTasks = calendarTasks.filter((task) => {
              const range = getTaskRange(task);
              return range && day >= range.start && day <= range.end;
            });
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={`calendar-day ${calendarMode === 'month' && !isSameMonth(day, anchorDate) ? 'outside-month' : ''} ${isToday(day) ? 'today' : ''}`}
              >
                <span className="calendar-day-number">{format(day, calendarMode === 'week' ? 'EEE, MMM d' : 'd')}</span>
                <div className="calendar-day-tasks">
                  {dayTasks.map((task) => renderTaskButton(task, true))}
                </div>
              </div>
            );
          })}
        </div>
        {calendarTasks.length === 0 && (
          <p className="schedule-empty">No dated tasks match your current filters.</p>
        )}
        {renderUnscheduled()}
      </section>
    );
  }

  const scheduledTasks = tasks
    .map((task) => ({ task, range: getTaskRange(task) }))
    .filter((item) => item.range && item.range.end >= timeline.start && item.range.start <= timeline.end)
    .sort((a, b) => a.range.start - b.range.start);
  const totalDays = timeline.days.length;
  const todayOffset = differenceInCalendarDays(new Date(), timeline.start);
  const todayPosition = (todayOffset / totalDays) * 100;

  return (
    <section className="schedule-view" aria-label="Task timeline">
      <div className="schedule-toolbar">
        <div className="schedule-navigation">
          <button type="button" className="schedule-nav-button" onClick={() => navigate(-1)} aria-label="Previous period">
            <FiChevronLeft />
          </button>
          <h2>{getRangeLabel()}</h2>
          <button type="button" className="schedule-nav-button" onClick={() => navigate(1)} aria-label="Next period">
            <FiChevronRight />
          </button>
          <button type="button" className="schedule-today-button" onClick={() => setAnchorDate(new Date())}>Today</button>
        </div>
        <div className="schedule-mode-toggle" aria-label="Timeline scale">
          {['weeks', 'months'].map((mode) => (
            <button
              type="button"
              key={mode}
              className={timelineMode === mode ? 'active' : ''}
              onClick={() => setTimelineMode(mode)}
            >
              {mode === 'weeks' ? 'Weeks' : 'Months'}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-scroll">
        <div className={`timeline-chart ${timelineMode === 'months' ? 'monthly' : 'daily'}`}>
          <div className="timeline-header">
            <div className="timeline-task-heading">Task</div>
            <div
              className="timeline-scale"
              style={{ gridTemplateColumns: timelineMode === 'weeks'
                ? `repeat(${totalDays}, minmax(38px, 1fr))`
                : timeline.months.map((month) => `${month.days}fr`).join(' ') }}
            >
              {timelineMode === 'weeks'
                ? timeline.days.map((day) => (
                  <div className={`timeline-date ${isToday(day) ? 'today' : ''}`} key={format(day, 'yyyy-MM-dd')}>
                    <span>{format(day, 'EEE')}</span>
                    <strong>{format(day, 'd')}</strong>
                  </div>
                ))
                : timeline.months.map((month) => (
                  <div className="timeline-date month-label" key={month.key}>
                    <strong>{format(month.date, 'MMM yyyy')}</strong>
                  </div>
                ))}
            </div>
          </div>

          {scheduledTasks.length === 0 ? (
            <p className="schedule-empty">No dated tasks match your current filters.</p>
          ) : scheduledTasks.map(({ task, range }) => {
            const startOffset = Math.max(0, differenceInCalendarDays(range.start, timeline.start));
            const endOffset = Math.min(totalDays, differenceInCalendarDays(addDays(range.end, 1), timeline.start));
            const left = (startOffset / totalDays) * 100;
            const width = Math.max(((endOffset - startOffset) / totalDays) * 100, 1);
            const project = getTaskProject(task, projects);
            return (
              <div className="timeline-row" key={task._id}>
                <button type="button" className="timeline-task-info" onClick={() => onSelectTask(task)}>
                  <span className="timeline-status-dot" style={{ backgroundColor: statusColors[task.status] || statusColors.todo }} />
                  <span className="timeline-task-name">{task.title}</span>
                  <span className="timeline-project-name">{project?.name || 'Unlinked'}</span>
                </button>
                <div className="timeline-track">
                  {todayOffset >= 0 && todayOffset < totalDays && (
                    <span className="timeline-today-marker" style={{ left: `${todayPosition}%` }} />
                  )}
                  <button
                    type="button"
                    className="timeline-bar"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      '--task-color': statusColors[task.status] || statusColors.todo
                    }}
                    onClick={() => onSelectTask(task)}
                    title={`${task.title} · ${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d')}`}
                  >
                    {width > 12 ? task.title : ''}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="timeline-legend">
        {Object.entries(statusLabels).map(([status, label]) => (
          <span key={status}><i style={{ backgroundColor: statusColors[status] }} />{label}</span>
        ))}
        <span><FiClock /> Task bars use start date and due date</span>
      </div>
      {renderUnscheduled()}
    </section>
  );
};

export default TaskScheduleViews;
