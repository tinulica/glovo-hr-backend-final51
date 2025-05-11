export const updateOrganization = async (req, res) => {
  try {
    const { name, bio, invites } = req.body;

    const org = await prisma.organization.update({
      where: { id: req.user.orgId },
      data: {
        name,
        bio,
      },
    });

    // TODO: Optionally send invites
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update organization' });
  }
};
