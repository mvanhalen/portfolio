"use client";
import { motion } from 'framer-motion';
import VerticalTabs from '@/components/VerticalTabs';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from '@/components/ui/button';
import { sectionVariants } from '@/lib/constants';
import Cards from '@/components/Cards';
import Image from 'next/image';
import OpenAIChat from '@/components/OpenAiChat';
import { ThemeToggle } from '@/components/ThemeToggle';

const skills = [
  'JavaScript / TypeScript', 'Svelte', 'React', 'C#', 'Dart (Flutter)', 'Go', 'SQL', 'GraphQL', 'Solidity',
  'SvelteKit', 'Angular', 'Vue', 'Next.js', 'Bootstrap', 'Flutter',
  'Azure', 'Google Cloud', 'Cloudflare', 'Vercel', 'BigQuery', 'GitHub', 'Docker', 'Redis', 'RabbitMQ',
  'ETH scaffold', 'Hardhat', 'Chai', 'DeSo', 'Ethereum', 'Polygon', 'Web3', 'SocialFi', 'Lens Protocol',
  'WalletConnect', 'Alchemy', 'Infura'
];

export default function Home() {
  // This is the main component for the home page
  return (
    // The main container for the page
    <div className="max-w-4xl mx-auto relative">

      <div className="flex justify-end mb-4 pt-8">
        <ThemeToggle/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8 px-4 sm:py-10"
      >
       
        <Image
          src="/images/meprofile.jpg"
          alt="Martijn van Halen"
          width={164}
          height={164}
          className="rounded-xl object-contain object-center mx-auto"
        />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-8">Martijn van Halen</h1>
        <p className="text-base sm:text-lg md:text-xl mt-2">Seasoned Full-Stack Engineer & Technical Founder in Fintech, Mobile Apps, Cloud, and Crypto/Web3</p>
      </motion.div>

      <ImageCarousel />
      
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-8 px-4 sm:py-10 max-w-3xl mx-auto"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Summary</h2>
        <p className="text-sm sm:text-base">
          I am a full-stack engineer and technical founder with over 20 years of experience in fintech, mobile apps, cloud computing, and crypto/Web3. I have built products and services from the ground up, creating viable businesses that scaled to acquisitions (e.g., Payvision, sold for $200M) and startups that secured venture capital ($500K). My expertise spans developing minimum viable products, achieving product-market fit, and driving growth to millions of users, subscriptions, and transactions. Never failed a project.
        </p>
      </motion.section>
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-8 px-4 sm:py-10 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Get in Touch</h2>
        <p className="text-sm sm:text-base mb-6">
          I&apos;m available for technical co-founder roles, full stack engineering, mobile app development or (fractional) CTO.
          Interested in collaborating or discussing a project or role? Reach out!
        </p>
        <div className="flex justify-center mb-4 gap-4">
          <Button asChild>
            <a href="mailto:martijn.vanhalen@gmail.com">Contact Me</a>
          </Button>
          <Button asChild>
            <a href="https://www.linkedin.com/in/mvanhalen">LinkedIn</a>
          </Button>
        </div>

      </motion.section>
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-8 px-4 sm:py-10 max-w-3xl mx-auto"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Experience</h2>
        <VerticalTabs />
      </motion.section>

      <Cards />

      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-8 px-4 sm:py-10 max-w-4xl mx-auto"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Skills and Technologies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <motion.div
              key={skill}
              whileHover={{ scale: 1.05 }}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-center text-sm sm:text-base"
            >
              {skill}
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-8 px-4 sm:py-10 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Get in Touch</h2>
        <p className="text-sm sm:text-base mb-6">
          I&apos;m available for technical co-founder roles, full stack engineering, mobile app development or (fractional) CTO.
          Interested in collaborating or discussing a project or role? Reach out!
        </p>
        <div className="flex justify-center mb-4 gap-4">
          <Button asChild>
            <a href="mailto:martijn.vanhalen@gmail.com">Contact Me</a>
          </Button>
          <Button asChild>
            <a href="https://www.linkedin.com/in/mvanhalen">LinkedIn</a>
          </Button>
        </div>

      </motion.section>
      <OpenAIChat />
    </div>
  
  );
}