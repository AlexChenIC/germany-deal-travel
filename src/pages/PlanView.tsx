export function PlanView() {
  const planRows = [
    ["城市半日", "柏林市内活动、展览、food festival、亲子馆", "宝宝作息优先，控制换乘"],
    ["周末短途", "Potsdam、Brandenburg、Spreewald、Ostsee、Therme", "车程/火车 1-3 小时"],
    ["3-5 天轻度假", "德国/波兰/丹麦/奥地利酒店与度假村", "厨房、婴儿床、泳池优先"],
    ["7 天全包", "Turkey、Egypt、Greece、Spain 等阳光目的地", "直飞、接送、全包、儿童设施"],
    ["邮轮", "MSC、Mein Schiff、AIDA、地中海/北欧", "确认婴儿政策和岸上节奏"],
  ];

  return (
    <section className="plan-board">
      {planRows.map(([title, focus, note]) => (
        <article className="plan-row" key={title}>
          <h3>{title}</h3>
          <p>{focus}</p>
          <span>{note}</span>
        </article>
      ))}
    </section>
  );
}
