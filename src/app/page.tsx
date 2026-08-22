import { ActionField } from "@/components/ActionField";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroPortrait } from "@/components/HeroPortrait";
import { LoveLooks } from "@/components/LoveLooks";
import { Manifesto } from "@/components/Manifesto";
import { PortraitWall } from "@/components/PortraitWall";
import { StoryFeature } from "@/components/StoryFeature";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <HeroPortrait />
        <Manifesto />
        <PortraitWall />
        <StoryFeature />
        <LoveLooks />
        <ActionField />
      </main>
      <Footer />
    </>
  );
}
