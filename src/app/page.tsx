import { MainLayout } from "@/components/layout/MainLayout";
import { Greeting } from "@/components/my-work/Greeting";
import { MyStories } from "@/components/my-work/MyStories";
import { MyChecklists } from "@/components/my-work/MyChecklists";
import { UpcomingDates } from "@/components/my-work/UpcomingDates";
import { ActivityFeed } from "@/components/my-work/ActivityFeed";

export default function MyWorkPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <Greeting />

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Stories, Checklists, Dates */}
          <div className="space-y-6 lg:col-span-2">
            <MyStories />

            {/* Sur mobile : Dates à venir en premier (plus urgent), Checklists en second */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="order-2 md:order-1"><MyChecklists /></div>
              <div className="order-1 md:order-2"><UpcomingDates /></div>
            </div>
          </div>

          {/* Right Column - Activity Feed (en dernier sur mobile) */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
