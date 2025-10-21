import dayjs from "dayjs";
import jalaliday from "jalaliday";

dayjs.extend(jalaliday);

dayjs.locale("fa");

declare module "dayjs" {
  interface Dayjs {
    formatNumeral(format?: string): string;
  }
}

export const formatJalali = (date: string | number | Date, format = "YYYY/MM/DD HH:mm") => {
  return dayjs(date).calendar("jalali").locale("fa").format(format).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
};

export default dayjs;
