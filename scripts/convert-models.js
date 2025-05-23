import { promisify } from 'util';
import { glob } from 'glob';
import { exec } from 'child_process';

const sh = promisify(exec);

async function main() {
    const files = await glob('public/models/**/*.obj');
    for (const f of files) {
        const out = f.replace(/\.obj$/, '.glb');
        console.log(`Converting ${f} → ${out}`);
        await sh(`obj2gltf -i "${f}" -o "${out}" --binary --draco.compressionLevel=7`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
