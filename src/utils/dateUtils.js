
export function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

export function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return ((endH + endM / 60) - (startH + startM / 60)).toFixed(1);
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export function formatDateShort(date) {
    return new Date(date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short'
    });
}
