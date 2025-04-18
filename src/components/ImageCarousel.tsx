"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";


interface ImageType {
  src: string;
  alt: string;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const images:ImageType[] = [
  { src: "/images/nftz-home.png", alt: "NFTz home" },
  { src: "/images/nftz-user.png", alt: "NFTz profile" },
  { src: "/images/intersocial.png", alt: "InterSocial home" },
  { src: "/images/intersocial-mobile.png", alt: "InterSocial mobile app" },
  { src: "/images/orna-auctions.png", alt: "Orna" },
  { src: "/images/orna-auction-styled.png", alt: "Orna" },
  { src: "/images/igenapps.png", alt: "iGenApps" },
];

export default function ImageCarousel() {
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);

  const openImageViewer = (image:ImageType) => {
    setSelectedImage(image);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="py-4 px-4 sm:py-10"
    >
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={2}
        navigation
        pagination={{ clickable: true }}
        className="max-w-full sm:max-w-4xl mx-auto"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div
              className="cursor-pointer"
              onClick={() => openImageViewer(image)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={800}
                height={400}
                className="rounded-lg w-full h-auto object-contain object-center"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl w-full h-[80vh] bg-transparent">
            <button
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center z-10"
            >
              ×
            </button>
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={3}
              centerOnInit
              wheel={{ disabled: false }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    <button
                      onClick={() => zoomIn()}
                      className="bg-white text-black px-3 py-1 rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => zoomOut()}
                      className="bg-white text-black px-3 py-1 rounded"
                    >
                      -
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="bg-white text-black px-3 py-1 rounded"
                    >
                      Reset
                    </button>
                  </div>
                  <TransformComponent
                    wrapperStyle={{
                      width: "100%",
                      height: "100%",
                    }}
                    contentStyle={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={selectedImage.src}
                        alt={selectedImage.alt}
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-lg"
                        priority
                      />
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </motion.section>
  );
}