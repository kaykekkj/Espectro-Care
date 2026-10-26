(function () {
    const normalize = value => String(value || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
    // O DTO atual só possui formacao (texto livre), sem especialidade.
    // Aceita apenas denominações completas conhecidas; não infere pela bio,
    // pelo CRM, por "Medicina" nem por fragmentos como "neuro".
    const areas = {
        psicologo: ["Psicologia", "Psicólogo", "Psicóloga", "Psicólogos", "Psicólogas"],
        fonoaudiologo: ["Fonoaudiologia", "Fonoaudiólogo", "Fonoaudióloga", "Fonoaudiólogos", "Fonoaudiólogas"],
        "terapeuta-ocupacional": ["Terapia Ocupacional", "Terapeuta Ocupacional", "Terapeutas Ocupacionais"],
        nutricionista: ["Nutrição", "Nutricionista", "Nutricionistas"],
        neuropediatra: ["Neuropediatria", "Neurologia Pediátrica", "Neuropediatra", "Neuropediatras"],
        psiquiatra: ["Psiquiatria", "Psiquiatra", "Psiquiatras"]
    };
    const aliases = new Map(Object.entries(areas).flatMap(([key, names]) =>
        [key, ...names].map(name => [normalize(name), key])));
    const key = value => aliases.get(normalize(value)) || "";
    window.EspectroCareEspecialidades = Object.freeze({ normalize, key });
})();
