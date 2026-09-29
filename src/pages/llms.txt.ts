import type { APIRoute } from "astro";
import { getDwellings } from "../lib/dwellings";

export const GET: APIRoute = async () => {
  const { house, villa, combined } = await getDwellings();
  const bedrooms = (d: { bedrooms: unknown[] }) => d.bedrooms.length;

  const body = `# The Hillside Retreat

> Two-dwelling holiday accommodation on the eastern edge of Tamborine Mountain, Queensland, in the Gold Coast hinterland. Hillside House sleeps ${house.sleeps} across ${bedrooms(house)} bedrooms, Hillside Villa sleeps ${villa.sleeps}, and the two combine for groups of up to ${combined.sleeps}. Owner-hosted, with a shared pool and heated spa, wood fireplaces, EV charging and coastal views to the Gold Coast.

Address: 25 Leona Court, Tamborine Mountain QLD 4272, Australia
Phone: +61 466 990 185
Email: stay@thehillside.com.au
Hosts: Glen and Rowena, on site
Website: https://www.thehillside.com.au/

## Dwellings

- [Hillside House](https://www.thehillside.com.au/hillside-house/): ${bedrooms(house)}-bedroom, ${house.bathrooms}-bathroom family home sleeping ${house.sleeps}. Wood fireplace, wraparound verandah with gas BBQ, full kitchen and laundry, air-conditioning, 60-inch TV with Netflix.
- [Hillside Villa](https://www.thehillside.com.au/hillside-villa/): self-contained ${bedrooms(villa)}-bedroom villa for a couple. Private courtyard, wood fireplace, kitchenette, gas BBQ, air-conditioning.
- [House and Villa together](https://www.thehillside.com.au/house-and-villa/): both dwellings as one booking sleeping up to ${combined.sleeps}, with a connecting door and exclusive use of the pool and spa. Direct bookings only, by email or phone.

## Facts

- Check-in from 2:00 pm, check-out by 10:00 am
- Minimum stay 2 nights
- Pool and heated spa shared between the two dwellings
- EV charging: 7.3 kW Type 2
- Free private parking, Wi-Fi, bed linen and towels supplied
- No pets. Smoking outdoors only in the designated area
- Cancellation: free until 7 days before arrival, 50% within 7 days, non-refundable within 24 hours
- Drive times: about 1 hour from Brisbane, 30 minutes from Surfers Paradise

## Pages

- [Book direct](https://www.thehillside.com.au/book/)
- [Frequently asked questions](https://www.thehillside.com.au/faq/)
- [Guest information and policies](https://www.thehillside.com.au/guest-info/)
- [Location and things to do on Tamborine Mountain](https://www.thehillside.com.au/location/)
- [Reviews](https://www.thehillside.com.au/reviews/)
- [Gallery](https://www.thehillside.com.au/gallery/)
- [Your hosts and contact](https://www.thehillside.com.au/contact-us/)
- [Mobile massage](https://www.thehillside.com.au/mountain-mobile-massage/)
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
