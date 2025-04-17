import { Smartphone, Cloud, Brain, Wrench } from "lucide-react"; // Add these imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/constants";

export default function Cards() {
  return (

    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="py-8 px-4 sm:py-10 max-w-4xl mx-auto"
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Expertise</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          {
            title: "Mobile First & App Development",
            icon: <Smartphone className="w-12 h-12 text-gray-700 dark:text-gray-300" />,
            content: (
              <>
                <p className="text-sm sm:text-base mb-2">
                 Building <strong>iOS</strong> and <strong>Android</strong> apps using{" "}
                  <strong>Flutter</strong>.
                </p>
                <ul className="list-disc pl-5 text-sm sm:text-base">
                  <li>Developed <strong>InterSocial</strong> mobile app</li>
                  <li>Created mobile app generator for <strong>iGenApps</strong></li>
                  <li>Implemented mobile first <strong>PWAs</strong></li>
                </ul>
              </>
            ),
          },
          {
            title: "Cloud",
            icon: <Cloud className="w-12 h-12 text-gray-700 dark:text-gray-300" />,
            content: (
              <>
                <p className="text-sm sm:text-base mb-2">
                  Proficient in cloud infrastructure with <strong>Azure</strong>, <strong>Google Cloud</strong>, and{" "}
                  <strong>Vercel</strong>.
                </p>
                <ul className="list-disc pl-5 text-sm sm:text-base">
                  <li>Deployed scalable apps for <strong>NFTz</strong> and <strong>iGenApps</strong></li>
                  <li>Utilized <strong>BigQuery</strong> for analytics</li>
                </ul>
              </>
            ),
          },
          {
            title: "AI",
            icon: <Brain className="w-12 h-12 text-gray-700 dark:text-gray-300" />,
            content: (
              <>
                <p className="text-sm sm:text-base mb-2">
                  Leveraged <strong>AI</strong> to build innovative services.
                </p>
                <ul className="list-disc pl-5 text-sm sm:text-base">
                  <li>
                    Created <strong>AI rooms</strong> service with <strong>Next.js</strong>
                  </li>
                  <li>Integrated <strong>OpenAI embeddings</strong></li>
                  <li><strong>Coding</strong>with Co Pilot, Grok and OpenAI </li>
                </ul>
              </>
            ),
          },
          {
            title: "DevOps / Tooling",
            icon: <Wrench className="w-12 h-12 text-gray-700 dark:text-gray-300" />,
            content: (
              <>
                <p className="text-sm sm:text-base mb-2">
                  Skilled in <strong>DevOps</strong> with <strong>GitHub</strong> and <strong>Docker</strong>.
                </p>
                <ul className="list-disc pl-5 text-sm sm:text-base">
                  <li>Implemented <strong>Docker</strong> for microservices</li>
                  <li>Used <strong>RabbitMQ</strong> for queuing</li>
                  <li>Set up <strong>GitHub Actions</strong></li>
                </ul>
              </>
            ),
          },
        ].map((section) => (
          <motion.div
            key={section.title}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-gray-50 dark:bg-gray-800 border-none shadow-md">
              <CardHeader className="flex flex-row items-center space-x-4">
                {section.icon}
                <CardTitle className="text-lg sm:text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>{section.content}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>)
};
