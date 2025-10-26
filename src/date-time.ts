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
		if (isNaN(int)) {
			return null
		}
		return new DateTime(new Date(int));
	}

	subtract(value: number) {
		return new DateTime(new Date(this.date.getTime() - value * DAY_LENGTH));
	}

	add(value: number) {
		return new DateTime(new Date(this.date.getTime() + value * DAY_LENGTH));
	}

	weekDay() {
		return this.date.getUTCDay() === 0 ? 7 : this.date.getUTCDay();
	}

	hour() {
		return this.date.getUTCHours();
	}

	toISO() {
		return this.date.toISOString().substring(0, 10);
	}

	toTime() {
		return this.date.toISOString().substring(11, 16);
	}
}