"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const images = [
  { src: "/images/nftz-home.png", alt: "NFTz home" },
  { src: "/images/nftz-user.png", alt: "NFTz profile" },
  { src: "/images/orna-auctions.png", alt: "Orna" },
  { src: "/images/igenapps.png", alt: "iGenApps" },
];

export default function ImageCarousel() {
  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="py-8 px-4 sm:py-10"
    >
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        className="max-w-full sm:max-w-4xl mx-auto"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <Image
              src={image.src}
              alt={image.alt}
              width={800}
              height={400}
              className="rounded-lg w-full h-auto object-contain object-center"
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.section>
  );
}