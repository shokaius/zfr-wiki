import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { CropsIndex, CropDetail } from "./pages/Crops";
import { ZombiesIndex, ZombieDetail } from "./pages/Zombies";
import { EnemiesIndex, EnemyDetail } from "./pages/Enemies";
import { PlaceablesIndex, PlaceableDetail } from "./pages/Placeables";
import { BoostsPage } from "./pages/Boosts";
import { MutationsPage } from "./pages/Mutations";
import { AbilitiesPage } from "./pages/Abilities";
import { RaidsIndex, RaidDetail } from "./pages/Raids";
import { CombatPage } from "./pages/Combat";
import { CombiningPage } from "./pages/Combining";
import { EpicBossesIndex, EpicBossDetail } from "./pages/EpicBosses";
import { QuestsPage } from "./pages/Quests";
import { EconomyPage } from "./pages/Economy";
import { ProgressionPage } from "./pages/Progression";
import { AboutPage } from "./pages/About";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crops" element={<CropsIndex />} />
          <Route path="/crops/:slug" element={<CropDetail />} />
          <Route path="/zombies" element={<ZombiesIndex />} />
          <Route path="/zombies/:slug" element={<ZombieDetail />} />
          <Route path="/enemies" element={<EnemiesIndex />} />
          <Route path="/enemies/:slug" element={<EnemyDetail />} />
          <Route path="/placeables" element={<PlaceablesIndex />} />
          <Route path="/placeables/:slug" element={<PlaceableDetail />} />
          <Route path="/boosts" element={<BoostsPage />} />
          <Route path="/mutations" element={<MutationsPage />} />
          <Route path="/abilities" element={<AbilitiesPage />} />
          <Route path="/raids" element={<RaidsIndex />} />
          <Route path="/raids/:slug" element={<RaidDetail />} />
          <Route path="/combat" element={<CombatPage />} />
          <Route path="/combining" element={<CombiningPage />} />
          <Route path="/epic-bosses" element={<EpicBossesIndex />} />
          <Route path="/epic-bosses/:slug" element={<EpicBossDetail />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/economy" element={<EconomyPage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
