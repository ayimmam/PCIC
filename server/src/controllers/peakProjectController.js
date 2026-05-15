import ProjectComment from "../models/ProjectComment.js";

const VALID_SLUGS = [
  "telcom-customer-churn",
  "smart-resume-matching",
  "internship-readiness",
  "group-assignment-coordination",
  "campus-event-rsvp",
  "pcic-lms",
  "fault-reporting",
  "pcic-management-system",
];

export async function getComments(req, res) {
  try {
    const { slug } = req.params;

    if (!VALID_SLUGS.includes(slug)) {
      return res.status(400).json({ message: "Invalid project slug" });
    }

    const comments = await ProjectComment.find({ projectSlug: slug })
      .sort({ createdAt: -1 })
      .lean();

    res.json(comments);
  } catch (error) {
    console.error("getComments error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function postComment(req, res) {
  try {
    const { projectSlug, authorName, body, type } = req.body;

    if (!projectSlug || !authorName?.trim() || !body?.trim()) {
      return res
        .status(400)
        .json({ message: "projectSlug, authorName, and body are required" });
    }

    if (!VALID_SLUGS.includes(projectSlug)) {
      return res.status(400).json({ message: "Invalid project slug" });
    }

    if (authorName.trim().length > 100) {
      return res
        .status(400)
        .json({ message: "authorName must be 100 characters or fewer" });
    }

    if (body.trim().length > 1000) {
      return res
        .status(400)
        .json({ message: "body must be 1000 characters or fewer" });
    }

    if (type && !["comment", "bug"].includes(type)) {
      return res
        .status(400)
        .json({ message: "type must be 'comment' or 'bug'" });
    }

    const comment = await ProjectComment.create({
      projectSlug,
      authorName: authorName.trim(),
      body: body.trim(),
      type: type || "comment",
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("postComment error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
