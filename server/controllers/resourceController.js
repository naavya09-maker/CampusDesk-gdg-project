const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categories = ["hall", "equipment", "room", "other"];

const getAllResources = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9));
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    if (category && !categories.includes(category)) {
      return res.status(400).json({ message: "Invalid resource category" });
    }

    const where = {
      isActive: true,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { location: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return res.json({ data, page, limit, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getResource = async (req, res) => {
  try {
    const resource = await prisma.resource.findFirst({
      where: { id: Number(req.params.id), isActive: true },
    });

    if (!resource) return res.status(404).json({ message: "Resource not found" });
    return res.json(resource);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const validateResource = (body) => {
  const errors = {};
  const fields = ["name", "description", "location", "openTime", "closeTime"];

  for (const field of fields) {
    if (!String(body[field] || "").trim()) {
      errors[field] = `${field} is required`;
    }
  }

  if (!categories.includes(body.category)) {
    errors.category = "Category must be hall, equipment, room or other";
  }

  return errors;
};

const createResource = async (req, res) => {
  try {
    const errors = validateResource(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the resource fields", errors });
    }

    const resource = await prisma.resource.create({
      data: {
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        location: req.body.location.trim(),
        category: req.body.category,
        openTime: req.body.openTime,
        closeTime: req.body.closeTime,
      },
    });

    return res.status(201).json(resource);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateResource = async (req, res) => {
  try {
    const errors = validateResource(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the resource fields", errors });
    }

    const resource = await prisma.resource.update({
      where: { id: Number(req.params.id) },
      data: {
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        location: req.body.location.trim(),
        category: req.body.category,
        openTime: req.body.openTime,
        closeTime: req.body.closeTime,
        ...(typeof req.body.isActive === "boolean" ? { isActive: req.body.isActive } : {}),
      },
    });

    return res.json(resource);
  } catch (error) {
    console.error(error);
    if (error.code === "P2025") return res.status(404).json({ message: "Resource not found" });
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await prisma.resource.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });

    return res.json({
      message: "Resource deleted successfully",
      resource,
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2025") return res.status(404).json({ message: "Resource not found" });
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
};
