
type PincodeRange = {
    min: number;
    max: number;
};

type CityPincodeMap = {
    [city: string]: string[]; // Prefixes e.g. ["411", "412"]
};

type StatePincodeMap = {
    [state: string]: {
        range: PincodeRange[];
        cities: CityPincodeMap;
    };
};

const PINCODE_DATA: StatePincodeMap = {
    "Maharashtra": {
        range: [{ min: 400000, max: 449999 }],
        cities: {
            "Mumbai": ["400"],
            "Pune": ["411", "412"],
            "Nagpur": ["440", "441"],
            "Nashik": ["422"],
            "Thane": ["4006", "401"],
            "Aurangabad": ["431"],
        }
    },
    "Delhi": {
        range: [{ min: 110000, max: 110999 }], // Technically Delhi is mostly 110xxx
        cities: {
            "New Delhi": ["110"],
            "South Delhi": ["110"],
            "North Delhi": ["110"],
        }
    },
    "Karnataka": {
        range: [{ min: 560000, max: 599999 }],
        cities: {
            "Bengaluru": ["560", "561", "562"],
            "Mysuru": ["570", "571"],
            "Hubballi-Dharwad": ["580"],
            "Mangaluru": ["575"],
        }
    },
    "Tamil Nadu": {
        range: [{ min: 600000, max: 649999 }],
        cities: {
            "Chennai": ["600"],
            "Coimbatore": ["641"],
            "Madurai": ["625"],
            "Tiruchirappalli": ["620"],
            "Salem": ["636"],
        }
    },
    "Uttar Pradesh": {
        range: [{ min: 201000, max: 289999 }],
        cities: {
            "Lucknow": ["226"],
            "Kanpur": ["208"],
            "Ghaziabad": ["201"],
            "Agra": ["282"],
            "Varanasi": ["221"],
            "Noida": ["201"],
            "Prayagraj": ["211"],
        }
    },
    "Gujarat": {
        range: [{ min: 360000, max: 399999 }],
        cities: {
            "Ahmedabad": ["380", "382"],
            "Surat": ["395", "394"],
            "Vadodara": ["390", "391"],
            "Rajkot": ["360"],
        }
    },
    "West Bengal": {
        range: [{ min: 700000, max: 749999 }],
        cities: {
            "Kolkata": ["700"],
            "Howrah": ["711"],
            "Siliguri": ["734"],
        }
    },
    "Telangana": {
        range: [{ min: 500000, max: 509999 }], // Shared/Split with AP often starts with 5
        cities: {
            "Hyderabad": ["500", "501"],
            "Warangal": ["506"],
        }
    },
    "Andhra Pradesh": {
        range: [{ min: 510000, max: 539999 }],
        cities: {
            "Visakhapatnam": ["530", "531"],
            "Vijayawada": ["520", "521"],
            "Guntur": ["522"],
            "Tirupati": ["517"],
        }
    },
    "Rajasthan": {
        range: [{ min: 300000, max: 349999 }],
        cities: {
            "Jaipur": ["302"],
            "Jodhpur": ["342"],
            "Kota": ["324"],
            "Udaipur": ["313"],
        }
    },
    "Kerala": {
        range: [{ min: 670000, max: 699999 }],
        cities: {
            "Thiruvananthapuram": ["695"],
            "Kochi": ["682"],
            "Kozhikode": ["673"],
        }
    },
    "Punjab": {
        range: [{ min: 140000, max: 160999 }], // 14-16 zone
        cities: {
            "Ludhiana": ["141"],
            "Amritsar": ["143"],
            "Chandigarh": ["160"], // UT but covers Punjab area
            "Jalandhar": ["144"],
        }
    },
    "Haryana": {
        range: [{ min: 120000, max: 139999 }],
        cities: {
            "Gurugram": ["122"],
            "Faridabad": ["121"],
            "Panipat": ["132"],
        }
    },
    "Madhya Pradesh": {
        range: [{ min: 450000, max: 489999 }],
        cities: {
            "Indore": ["452"],
            "Bhopal": ["462"],
            "Gwalior": ["474"],
            "Jabalpur": ["482"],
        }
    },
    "Bihar": {
        range: [{ min: 800000, max: 859999 }],
        cities: {
            "Patna": ["800", "801"],
            "Gaya": ["823"],
            "Muzaffarpur": ["842"],
        }
    },
};

export function validatePincode(state: string, city: string, pincode: string): { isValid: boolean; message?: string } {
    if (!pincode || pincode.length !== 6 || isNaN(Number(pincode))) {
        return { isValid: false, message: "Pincode must be a 6-digit number." };
    }

    const pinVal = parseInt(pincode, 10);
    const stateData = PINCODE_DATA[state];

    // 1. Basic Knowledge Check (if we have data for this state)
    if (stateData) {
        // Check if falls within State Range
        const isInState = stateData.range.some(r => pinVal >= r.min && pinVal <= r.max);

        if (!isInState) {
            // Get expected start digits for better error message
            const startsWith = stateData.range.map(r => r.min.toString().substring(0, 2)).join(" or ");
            return {
                isValid: false,
                message: `Pincode ${pincode} does not seem to belong to ${state} (usually starts with ${startsWith}).`
            };
        }

        // 2. City Specific Check (if we have data for this city)
        const cityPrefixes = stateData.cities[city];
        if (cityPrefixes) {
            const matchesCity = cityPrefixes.some(prefix => pincode.startsWith(prefix));
            if (!matchesCity) {
                return {
                    isValid: false,
                    message: `Pincode ${pincode} does not match the usual codes for ${city} (starts with ${cityPrefixes.join(", ")}).`
                };
            }
        }
    } else {
        // Fallback checks for states not in our detailed map (Zones)
        // Zone 1: DL, HR, PB, HP, JK
        // Zone 2: UP, UK
        // Zone 3: RJ, GJ
        // Zone 4: MH, MP, CG
        // Zone 5: TS, AP, KA
        // Zone 6: TN, KL
        // Zone 7: WB, OD, Northeast
        // Zone 8: BR, JH
        // Simple first digit check if we want to be strict, but for now allow valid 6 digits if state unknown
    }

    return { isValid: true };
}
