import TeamFlag from "../shared/TeamFlag";

function PodiumCard({ label, teamCode, teamName, tone, size = "normal" }) {
  return (
    <div className={`podium-card podium-${tone} podium-${size}`}>
      <div className="podium-label">{label}</div>
      <TeamFlag code={teamCode} size="xl" alt={`${teamName} flag`} />
      <div className="podium-name">{teamName}</div>
      <div className="podium-code">{teamCode}</div>
    </div>
  );
}

export default function PodiumSection({ championTeam, runnerUpTeam, thirdPlaceTeam }) {
  if (!championTeam || !runnerUpTeam || !thirdPlaceTeam) {
    return null;
  }

  return (
    <section className="podium-grid">
      <PodiumCard label="RUNNER-UP" teamCode={runnerUpTeam.code} teamName={runnerUpTeam.name} tone="silver" />
      <PodiumCard label="CHAMPION" teamCode={championTeam.code} teamName={championTeam.name} tone="gold" size="featured" />
      <PodiumCard label="3RD PLACE" teamCode={thirdPlaceTeam.code} teamName={thirdPlaceTeam.name} tone="bronze" />
    </section>
  );
}
