import "./globals.css";
import LayoutWrapper from "./LayoutWrapper"; // Naya wrapper import kiya

export const metadata = {
  title: "Sanskar Cyber Cafe | Online Services in Lalganj Ajhara, Pratapgarh",

  description:
    "Sanskar Cyber Cafe, Lalganj Ajhara, Pratapgarh में Online Form, Sarkari Naukri Form, PAN Card, आय, जाति, निवास प्रमाण पत्र, Ration Card, Printout, Photocopy, Scanning और सभी Digital Services उपलब्ध हैं। कंप्यूटर इस्तेमाल करें मात्र ₹25 प्रति घंटा।",

  verification: {
    google: "mFhC3Uijk4vH2AolI-zmyHHL8OGgs3omrm91YRvc6sU",
  },

  keywords: [
    "Sanskar Cyber Cafe",
    "Cyber Cafe in Lalganj Ajhara",
    "Best Cyber Cafe in Pratapgarh",
    "Online Service Center Lalganj",
    "Online Form Center Lalganj Ajhara",
    "Sarkari Naukri Online Form",
    "PAN Card Services Pratapgarh",
    "Income Certificate Online",
    "Caste Certificate Online",
    "Domicile Certificate Online",
    "Ration Card Services",
    "Printout and Photocopy Lalganj",
    "Computer Rental Lalganj",
    "Internet Cafe Pratapgarh",
    "लालगंज साइबर कैफे",
    "लालगंज ऑनलाइन फॉर्म सेंटर",
    "प्रतापगढ़ साइबर कैफे",
    "ऑनलाइन सेवा केंद्र लालगंज",
  ],

  applicationName: "Sanskar Cyber Cafe",

  authors: [{ name: "Sanskar Cyber Cafe" }],

  creator: "Sanskar Cyber Cafe",

  publisher: "Sanskar Cyber Cafe",

  icons: {
    icon: "/images/sanskar-cyber.ico",
    shortcut: "/images/sanskar-cyber.ico",
    apple: "/images/sanskar-cyber.ico",
  },

  openGraph: {
    title: "Sanskar Cyber Cafe – Online Services in Lalganj Ajhara",
    description:
      "लालगंज अजहरा, प्रतापगढ़ में सभी ऑनलाइन सेवाएँ, सरकारी फॉर्म, PAN Card, प्रमाण पत्र, प्रिंटआउट और फोटोकॉपी। कंप्यूटर इस्तेमाल मात्र ₹25 प्रति घंटा।",
    siteName: "Sanskar Cyber Cafe",
    locale: "hi_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Sanskar Cyber Cafe | Lalganj Ajhara",
    description:
      "All Online Services, Government Forms, Printing, Scanning & Computer Rental at ₹25 per hour.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrapper check karega ki login page dikhana hai ya dashboard */}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
