export function formatBookingSlotTh(startTime: Date, endTime: Date) {
  const datePart = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(startTime);
  const timePart = (d: Date) =>
    new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(d);
  return `${datePart}\nเวลา ${timePart(startTime)} – ${timePart(endTime)}`;
}
