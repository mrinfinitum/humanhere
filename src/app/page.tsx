import { ActionField } from "@/components/ActionField";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroPortrait } from "@/components/HeroPortrait";
import { Manifesto } from "@/components/Manifesto";
import { PortraitWall } from "@/components/PortraitWall";
import { StoryFeature } from "@/components/StoryFeature";
import { WhatWeDoSequence } from "@/components/WhatWeDoSequence";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <HeroPortrait />
        <PortraitWall />
        <Manifesto />
        <StoryFeature />
        <WhatWeDoSequence />
        <ActionField />
      </main>
      <Footer />
    </>
  );
}
