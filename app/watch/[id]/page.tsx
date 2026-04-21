import { use } from "react";
import { WatchClient } from "./WatchClient";

type Params = { id: string };

export default function WatchPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const anihubId = Number(id);
  return <WatchClient anihubId={anihubId} />;
}
