import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Employee from "../models/Employee";

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);

  const deleted = await Employee.find({ isDeleted: true }).select(
    "reportingManager",
  );
  const parentOf = new Map<string, string | null>(
    deleted.map((d) => [
      d._id.toString(),
      d.reportingManager?.toString() ?? null,
    ]),
  );

  // Walk up past any deleted ancestors to the nearest live manager
  const nearestLive = (start: string | null) => {
    let cur = start;
    const seen = new Set<string>();
    while (cur && parentOf.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = parentOf.get(cur) ?? null;
    }
    return cur && !parentOf.has(cur) ? cur : null;
  };

  let fixed = 0;
  for (const [id, manager] of parentOf) {
    const res = await Employee.updateMany(
      { reportingManager: id, isDeleted: { $ne: true } },
      { reportingManager: nearestLive(manager) },
    );
    fixed += res.modifiedCount;
  }

  console.log(`Re-parented ${fixed} employee(s).`);
  await mongoose.disconnect();
})();
