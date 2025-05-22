export async function loadRockDatabase() {
    const basePath = 'models/';
    
    // A automatiser plus tard
    const rockDirs = [
        'UPS-DST-MM3-Benmoreite',
        'UPS-DST-MM7-Basalte',
        'UPS-DST-MM17-Tephrite',
        'UPS-DST-CA1-Bornes'
    ];

    const roches = [];

    for (const dir of rockDirs) {
        try {
            const res = await fetch(`${basePath}${dir}/metadata.json`);
            const data = await res.json();
            data.path = `${basePath}${dir}/`
            roches.push(data)
        } catch (err) {
            console.warn(`Reading error (metadata) in ${dir}`)
        }
    }

    return roches;
}