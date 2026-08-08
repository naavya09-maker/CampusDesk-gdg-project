const express = require("express");
const {
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getAllResources);
router.get("/:id", requireAuth, getResource);
router.post("/", requireAuth, requireAdmin, createResource);
router.patch("/:id", requireAuth, requireAdmin, updateResource);
router.delete("/:id", requireAuth, requireAdmin, deleteResource);

module.exports = router;
