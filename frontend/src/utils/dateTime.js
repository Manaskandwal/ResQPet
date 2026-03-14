const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
});

const parseDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatIndianDate = (value) => {
    const date = parseDate(value);
    return date ? dateFormatter.format(date) : 'N/A';
};

export const formatIndianTime = (value) => {
    const date = parseDate(value);
    return date ? timeFormatter.format(date) : 'N/A';
};

export const formatIndianDateTime = (value) => {
    const date = parseDate(value);
    return date ? dateTimeFormatter.format(date) : 'N/A';
};

export const toDateInputValue = (value) => {
    const date = parseDate(value);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const toTimeInputValue = (value) => {
    const date = parseDate(value);
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
