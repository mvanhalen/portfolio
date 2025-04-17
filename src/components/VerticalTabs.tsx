"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Currency, Cloud, CreditCard } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode; // Lucide icon component
  image: string; // Path to image for tab content
  content: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "crypto",
    label: "Crypto",
    icon: <Currency className="w-5 h-5" />,
    image: "/images/nftz-inc.png", // Replace with your image path
    content: (
      <div className="mt-4">
        <h3 className="text-lg sm:text-xl font-semibold">NFTz INC</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          CTO, Full Stack Developer, Co-founder - Dec 2021 - Present
        </p>
        <ul className="list-disc pl-5 mt-2 text-sm sm:text-base">
          <li>Responsible for all technical aspects of the platform</li>
          <li>Raised $500K and additional community funds</li>
          <li>Developed social NFT marketplaces (nftz.me, orna.art)</li>
          <li>Created InterSocial mobile app for iOS and Android</li>
          <li>Set up data flows and smart contracts on Polygon</li>
        </ul>
      </div>
    ),
  },
  {
    id: "saas",
    label: "SaaS",
    icon: <Cloud className="w-5 h-5" />,
    image: "/images/igenapps-inc.png", // Replace with your image path
    content: (
      <div className="mt-4">
        <h3 className="text-lg sm:text-xl font-semibold">iGenApps INC</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          CTO, Full Stack Developer, Co-founder - Dec 2013 - Jan 2022
        </p>
        <ul className="list-disc pl-5 mt-2 text-sm sm:text-base">
          <li>Set up backend and mobile app generator from scratch</li>
          <li>Scaled to millions of registered users</li>
          <li>Integrated subscription flows with Apple, Google, Stripe</li>
          <li>Developed instant mobile app PWAs and native previews</li>
        </ul>
      </div>
    ),
  },
  {
    id: "fintech",
    label: "Fintech",
    icon: <CreditCard className="w-5 h-5" />,
    image: "/images/payvision.gif", // Replace with your image path
    content: (
      <div className="mt-4">
        <h3 className="text-lg sm:text-xl font-semibold">Payvision</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          CTO, Co-founder - Apr 2002 - Mar 2009
        </p>
        <ul className="list-disc pl-5 mt-2 text-sm sm:text-base">
          <li>Set up technical services from scratch</li>
          <li>Built a 10-person tech team and opened a Madrid office</li>
          <li>Scaled to a successful fintech business, sold for $200M</li>
          <li>Developed payment processing solutions</li>
        </ul>
      </div>
    ),
  },
];

export default function Tabs() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant={activeTab === tab.id ? "default" : "outline"}
            className="w-full sm:w-48 py-3 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-1/3">
          <Image
            src={tabs.find((tab) => tab.id === activeTab)?.image || "/images/placeholder.png"}
            alt={`${tabs.find((tab) => tab.id === activeTab)?.label} image`}
            width={300}
            height={200}
            className="rounded-lg w-full h-auto object-cover"
          />
        </div>
        <div className="sm:w-2/3">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
      </div>
    </div>
  );
}