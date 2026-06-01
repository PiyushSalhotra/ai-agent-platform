import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get("origin")?.toUpperCase() || "BOM";
    const destination = searchParams.get("destination")?.toUpperCase();
    let departureDate = searchParams.get("departureDate");

    if (!destination) {
      return NextResponse.json({ error: "Missing required parameter: destination" }, { status: 400 });
    }

    // Default departure date to 30 days in the future if missing or invalid
    if (!departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      departureDate = futureDate.toISOString().split("T")[0];
    }

    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    const hasRealCredentials = 
      clientId && 
      clientSecret && 
      clientId !== "amadeus_client_id_placeholder" && 
      clientSecret !== "amadeus_client_secret_placeholder";

    if (!hasRealCredentials) {
      console.log(`[Amadeus API Proxy] Missing or placeholder credentials. Returning mock flight search for ${origin} -> ${destination} on ${departureDate}`);
      return NextResponse.json(getMockSearchResults(origin, destination, departureDate));
    }

    console.log(`[Amadeus API Proxy] Fetching OAuth token from Amadeus...`);
    const tokenRes = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("[Amadeus Auth Error]", tokenErr);
      return NextResponse.json(
        { error: "Amadeus authentication failed", details: tokenErr },
        { status: tokenRes.status }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    console.log(`[Amadeus API Proxy] Searching flights: ${origin} -> ${destination} on ${departureDate}`);
    const searchUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=1&max=5`;
    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      const searchErr = await searchRes.text();
      console.error("[Amadeus Flight Search Error]", searchErr);
      return NextResponse.json(
        { error: "Amadeus flight search failed", details: searchErr },
        { status: searchRes.status }
      );
    }

    const searchData = await searchRes.json();
    const flightOffers = searchData.data || [];
    const dictionaries = searchData.dictionaries || {};

    const formattedOffers = flightOffers.map((offer: any) => {
      const slice = offer.itineraries?.[0];
      const segment = slice?.segments?.[0];
      const carrierCode = segment?.carrierCode || offer.validatingAirlineCodes?.[0] || "Unknown";
      
      // Resolve carrier code to name if present in dictionaries
      const carrierName = dictionaries.carriers?.[carrierCode] || carrierCode;

      return {
        offerId: offer.id,
        carrier: carrierName,
        price: parseFloat(offer.price?.total || "0"),
        currency: offer.price?.currency || "INR",
        departureTime: segment?.departure?.at || "N/A",
        arrivalTime: segment?.arrival?.at || "N/A",
        duration: slice?.duration || "N/A",
        passengerId: "passenger-1",
      };
    });

    return NextResponse.json({
      success: true,
      origin,
      destination,
      departureDate,
      passengerId: "passenger-1",
      offers: formattedOffers,
    });
  } catch (error: any) {
    console.error("[Amadeus Proxy Search Exception]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getMockSearchResults(origin: string, destination: string, departureDate: string) {
  const passengerId = "pas_mock_amadeus_adult";
  return {
    success: true,
    origin,
    destination,
    departureDate,
    passengerId,
    offers: [
      {
        offerId: "amadeus_mock_indigo_001",
        carrier: "IndiGo",
        price: 4500.0,
        currency: "INR",
        departureTime: `${departureDate}T06:00:00`,
        arrivalTime: `${departureDate}T08:15:00`,
        duration: "PT2H15M",
        passengerId,
      },
      {
        offerId: "amadeus_mock_air_india_002",
        carrier: "Air India",
        price: 5200.0,
        currency: "INR",
        departureTime: `${departureDate}T10:30:00`,
        arrivalTime: `${departureDate}T12:45:00`,
        duration: "PT2H15M",
        passengerId,
      },
      {
        offerId: "amadeus_mock_vistara_003",
        carrier: "Vistara",
        price: 6100.0,
        currency: "INR",
        departureTime: `${departureDate}T17:45:00`,
        arrivalTime: `${departureDate}T20:00:00`,
        duration: "PT2H15M",
        passengerId,
      },
    ].sort((a, b) => a.price - b.price),
  };
}
