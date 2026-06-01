import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offerId, passengerId, firstName, lastName, email } = body;

    if (!offerId || !passengerId) {
      return NextResponse.json(
        { error: "Missing required parameters: offerId and passengerId" },
        { status: 400 }
      );
    }

    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    const hasRealCredentials = 
      clientId && 
      clientSecret && 
      clientId !== "amadeus_client_id_placeholder" && 
      clientSecret !== "amadeus_client_secret_placeholder";

    if (!hasRealCredentials) {
      console.log(`[Amadeus API Proxy] No active credentials. Returning mock booking for offer ${offerId}`);
      return NextResponse.json(getMockBookingResponse(offerId, firstName, lastName));
    }

    console.log(`[Amadeus API Proxy] Booking flight for offer ${offerId} (passenger: ${passengerId})`);

    // In a production app, we would make a POST call to https://test.api.amadeus.com/v1/booking/flight-orders
    // However, real booking APIs have extremely strict checks (such as real passports, credit cards, pricing validation checks) 
    // which fail for mock developers. Thus, we simulate a successful order response for visual agent building.
    const mockRef = `AMD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      bookingRef: mockRef,
      status: "Confirmed (Simulated Amadeus Order)",
      flightId: "6E-125",
      passenger: `${firstName || "John"} ${lastName || "Doe"}`,
      price: "4500.00",
      currency: "INR",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Amadeus Proxy Booking Exception]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getMockBookingResponse(offerId: string, firstName: string, lastName: string) {
  return {
    success: true,
    bookingRef: `AMD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    status: "Confirmed (Mocked)",
    flightId: "AI-302",
    passenger: `${firstName || "Aisha"} ${lastName || "Sharma"}`,
    price: "5200.00",
    currency: "INR",
    timestamp: new Date().toISOString(),
  };
}
