const eventsContainer = document.getElementById('events-container');
let currentDate = new Date();
let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];

const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const currentWeekRange = document.getElementById('current-week-range');
const modal = document.getElementById('event-modal');
const openModalBtn = document.getElementById('open-modal');
const cancelBtn = document.getElementById('cancel-event');
const saveBtn = document.getElementById('save-event');

function saveEvents() {
  localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function initCalendar() {
  renderTimeSlots();
  renderWeekDays();
  renderHourGrid();
  setupModal();
  setDefaultDates();
  updateWeekRange();
  setupEventListeners();
}

function setupEventListeners() {
  prevWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    updateCalendar();
  });

  nextWeekBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    updateCalendar();
  });

  window.addEventListener('resize', updateCalendar);
}

function updateCalendar() {
  renderWeekDays();
  renderHourGrid();
  updateWeekRange();
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('modal-event-date').value = today;
  document.getElementById('modal-event-end-date').value = today;
}

function updateWeekRange() {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const options = { day: 'numeric', month: 'short' };
  currentWeekRange.textContent = 
    `${weekStart.toLocaleDateString('ru-RU', options)} - ${weekEnd.toLocaleDateString('ru-RU', options)}`;
}

function renderTimeSlots() {
  const timeColumn = document.querySelector('.time-column');
  timeColumn.innerHTML = '';

  for (let hour = 0; hour < 24; hour++) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
    timeColumn.appendChild(timeSlot);
  }
}

function renderWeekDays() {
  const weekDaysContainer = document.querySelector('.week-header');
  weekDaysContainer.innerHTML = '<div class="day-spacer"></div>';
  
  const dayAbbrs = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dayIndex = i;
    
    const dayElement = document.createElement('div');
    dayElement.className = 'day-header';
    dayElement.innerHTML = `
      <span class="day-abbr">${dayAbbrs[dayIndex]}</span>
      <span class="day-number">${dayDate.getDate()}</span>
    `;
    
    if (dayDate.toDateString() === currentDate.toDateString()) {
      dayElement.classList.add('selected');
    }
    
    dayElement.addEventListener('click', () => {
      document.querySelectorAll('.day-header').forEach(d => d.classList.remove('selected'));
      dayElement.classList.add('selected');
      currentDate = new Date(dayDate);
      renderEvents();
    });
    
    weekDaysContainer.appendChild(dayElement);
  }
}

function renderHourGrid() {
  eventsContainer.innerHTML = '';
  
  for (let i = 0; i < 7; i++) {
    const dayColumn = document.createElement('div');
    dayColumn.className = 'day-column';
    dayColumn.dataset.dayIndex = i;
    eventsContainer.appendChild(dayColumn);
  }
  
  for (let hour = 0; hour < 24; hour++) {
    const hourRow = document.createElement('div');
    hourRow.className = 'hour-row';
    hourRow.style.top = `${hour * 60}px`;
    eventsContainer.appendChild(hourRow);
    
    if (hour < 23) {
      const halfHourLine = document.createElement('div');
      halfHourLine.className = 'half-hour-line';
      halfHourLine.style.top = `${(hour * 60) + 30}px`;
      eventsContainer.appendChild(halfHourLine);
    }
  }
  
  renderEvents();
}

function setupModal() {
  openModalBtn.addEventListener('click', () => {
    document.getElementById('modal-event-title').value = '';
    setDefaultDates();
    document.getElementById('modal-event-start').value = '09:00';
    document.getElementById('modal-event-end').value = '10:00';
    modal.style.display = 'flex';
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  saveBtn.addEventListener('click', addNewEvent);
}

function addNewEvent() {
  const title = document.getElementById('modal-event-title').value;
  const startDate = document.getElementById('modal-event-date').value;
  const startTime = document.getElementById('modal-event-start').value;
  const endDate = document.getElementById('modal-event-end-date').value;
  const endTime = document.getElementById('modal-event-end').value;
  
  if (!title) {
    alert('Введите название события');
    return;
  }
  
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  
  if (endDateTime <= startDateTime) {
    alert('Дата/время окончания должны быть позже даты/времени начала');
    return;
  }

  if (startDate !== endDate) {
    const daysDiff = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
    const eventIdBase = Date.now();
    
    for (let i = 0; i <= daysDiff; i++) {
      const currentDay = new Date(startDateTime);
      currentDay.setDate(startDateTime.getDate() + i);
      
      let eventStartTime, eventEndTime;
      
      if (i === 0) {
        eventStartTime = startTime;
        eventEndTime = (daysDiff === 0) ? endTime : '23:59';
      } else if (i === daysDiff) {
        eventStartTime = '00:00';
        eventEndTime = endTime;
      } else {
        eventStartTime = '00:00';
        eventEndTime = '23:59';
      }
      
      const event = {
        id: eventIdBase + i,
        title: title + (daysDiff > 0 ? ` (${i+1}/${daysDiff+1})` : ''),
        startTime: eventStartTime,
        endTime: eventEndTime,
        date: new Date(currentDay),
        color: daysDiff > 0 ? '#34a853' : '#4285f4',
        isMultiDay: daysDiff > 0,
        eventGroupId: eventIdBase
      };
      
      events.push(event);
    }
  } else {
    const event = {
      id: Date.now(),
      title: title,
      startTime: startTime,
      endTime: endTime,
      date: new Date(startDateTime),
      color: '#4285f4',
      isMultiDay: false,
      eventGroupId: Date.now()
    };
    events.push(event);
  }
  
  saveEvents();
  renderEvents();
  modal.style.display = 'none';
}

function renderEvents() {
  document.querySelectorAll('.event').forEach(el => el.remove());
  
  const dayColumns = document.querySelectorAll('.day-column');
  
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= weekStart && eventDate < weekEnd;
  });
  
  weekEvents.forEach(event => {
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    
    let startPosition = startHours * 60 + startMinutes;
    let endPosition = endHours * 60 + endMinutes;
    
    if (endPosition < startPosition) {
      endPosition = 24 * 60;
    }
    
    const duration = endPosition - startPosition;
    const eventDate = new Date(event.date);
    const dayIndex = (eventDate.getDay() - weekStart.getDay() + 7) % 7;
    
    if (dayIndex >= 0 && dayIndex < 7 && dayColumns[dayIndex]) {
      const eventElement = document.createElement('div');
      eventElement.className = 'event' + (event.isMultiDay ? ' multi-day-event' : '');
      eventElement.innerHTML = `
        ${event.title} ${!event.isMultiDay ? `(${event.startTime}-${event.endTime})` : ''}
        <button class="delete-btn" data-id="${event.id}">×</button>
      `;
      eventElement.style.backgroundColor = event.color;
      eventElement.style.top = `${startPosition}px`;
      eventElement.style.height = `${duration}px`;
      
      dayColumns[dayIndex].appendChild(eventElement);
      
      eventElement.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Удалить это событие?')) {
          events = events.filter(e => e.eventGroupId !== event.eventGroupId);
          saveEvents();
          renderEvents();
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', initCalendar);