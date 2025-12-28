const DAY_LENGTH = 24 * 60 * 60 * 1000;

export default class DateTime {
  private date: Date;

  private constructor(date: Date) {
    this.date = date;
  }

  static now() {
    return new DateTime(new Date());
  }

  static parse(dateStr: string) {
    const int = Date.parse(dateStr);
    if (Number.isNaN(int)) {
      return null;
    }
    return new DateTime(new Date(int));
  }

  addDay(value: number) {
    return new DateTime(new Date(this.date.getTime() + value * DAY_LENGTH));
  }

  weekDay() {
    return this.date.getDay() === 0 ? 7 : this.date.getDay();
  }

  hour() {
    return this.date.getHours();
  }

  toDateString() {
    const day = this.date.getDate().toString().padStart(2, '0');
    const month = (this.date.getMonth() + 1).toString().padStart(2, '0');
    const year = this.date.getFullYear().toString().padStart(4, '0');
    return `${year}-${month}-${day}`;
  }

  toTimeString() {
    const hours = this.date.getHours().toString().padStart(2, '0');
    const minutes = this.date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  fullLocalDate(locale: string) {
    return this.date.toLocaleDateString(locale, {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'});
  }

  shortLocalDate(locale: string, withYear = false) {
    return this.date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      ...(withYear ? {year: 'numeric'} : {})
    });
  }

  sameDay(other: DateTime) {
    return this.date.getDate() === other.date.getDate() && this.date.getMonth() === other.date.getMonth() && this.date.getFullYear() === other.date.getFullYear();
  }

  day() {
    return this.date.getDate();
  }

  month() {
    return this.date.getMonth() + 1;
  }

  year() {
    return this.date.getFullYear();
  }

  daysInMonth() {
    return new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0).getDate();
  }

  monthLocalName(locale: string) {
    return this.date.toLocaleDateString(locale, {month: 'long', year: 'numeric'});
  }

  firstDayOfMonth() {
    return new DateTime(new Date(this.date.getFullYear(), this.date.getMonth(), 1, this.date.getHours(), this.date.getMinutes(), this.date.getMilliseconds()));
  }
}
