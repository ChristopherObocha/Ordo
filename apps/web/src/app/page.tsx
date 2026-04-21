"use client";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function Home() {
  const clergy = useQuery(api.clergy.list);
  const addClergy = useMutation(api.clergy.add);

  const handleAdd = async () => {
    await addClergy({ name: "Fr. Thomas", type: "priest" });
  };

  return (
    <div>
    <button onClick={handleAdd}>Add Priest</button>
    <ul>
      {clergy?.map((c) => <li key={c._id}>{c.name}</li>)}
    </ul>
  </div>
  );
}
