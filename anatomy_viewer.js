import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup Scene
const container = document.getElementById('anatomy-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f5); // Match body bg

// Camera
const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Increased intensity
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0); // Increased intensity
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Debug cube removed

// Raycaster for Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load Model
const loader = new GLTFLoader();
let humanModel;

// Fallback Model Generator (Since human.glb is empty/missing)
// Geometric "Muscle Man" Generator
function createMuscleMan(sceneRef) {
    const group = new THREE.Group();

    const muscleMaterial = new THREE.MeshStandardMaterial({
        color: 0xcd5c5c, // "IndianRed" - looks like muscle
        roughness: 0.4,
        metalness: 0.1
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaaaa, // Lighter for joints
        roughness: 0.5
    });

    // Helper to add parts
    function addPart(geo, mat, x, y, z, name, parent = group) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.name = name;
        mesh.castShadow = true;
        parent.add(mesh);
        return mesh;
    }

    // --- TORSO ---
    // Abs / Core
    const absGeo = new THREE.BoxGeometry(0.35, 0.4, 0.2);
    addPart(absGeo, muscleMaterial, 0, 1.0, 0, "Torso/Abs");

    // Chest (Pecs) - modeled as two boxes
    const pecGeo = new THREE.BoxGeometry(0.2, 0.2, 0.25);
    addPart(pecGeo, muscleMaterial, -0.11, 1.3, 0.05, "Torso/Pecs_L"); // Left Pec
    addPart(pecGeo, muscleMaterial, 0.11, 1.3, 0.05, "Torso/Pecs_R");  // Right Pec

    // Spine/Back (visual from rear)
    const spineGeo = new THREE.BoxGeometry(0.3, 0.6, 0.1);
    addPart(spineGeo, muscleMaterial, 0, 1.2, -0.1, "Back/Spine");

    // --- HEAD & NECK ---
    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.15, 12);
    addPart(neckGeo, jointMaterial, 0, 1.5, 0, "Neck");

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const head = addPart(headGeo, muscleMaterial, 0, 1.7, 0, "Head");

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    addPart(eyeGeo, eyeMat, -0.06, 0.05, 0.16, "Eye_L", head);
    addPart(eyeGeo, eyeMat, 0.06, 0.05, 0.16, "Eye_R", head);

    // --- ARMS ---
    function createArm(side) { // 1 for right, -1 for left
        const armGroup = new THREE.Group();
        armGroup.position.set(side * 0.25, 1.4, 0); // Shoulder socket
        group.add(armGroup);

        // Shoulder (Deltoid)
        addPart(new THREE.SphereGeometry(0.14, 16, 16), muscleMaterial, 0, 0, 0, "Arm/Deltoid", armGroup);

        // Upper Arm (Bicep/Tricep)
        const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.35, 12);
        addPart(upperArmGeo, muscleMaterial, side * 0.05, -0.25, 0, "Arm/Upper", armGroup);

        // Elbow
        addPart(new THREE.SphereGeometry(0.08), jointMaterial, side * 0.05, -0.45, 0, "Arm/Elbow", armGroup);

        // Forearm
        const foreArmGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.35, 12);
        addPart(foreArmGeo, muscleMaterial, side * 0.05, -0.65, 0, "Arm/Lower", armGroup);

        // Hand
        addPart(new THREE.BoxGeometry(0.08, 0.1, 0.08), jointMaterial, side * 0.05, -0.85, 0, "Arm/Hand", armGroup);
    }
    createArm(1);  // Right Arm
    createArm(-1); // Left Arm

    // --- LEGS ---
    function createLeg(side) { // 1 for right, -1 for left
        const legGroup = new THREE.Group();
        legGroup.position.set(side * 0.12, 0.8, 0); // Hip socket
        group.add(legGroup);

        // Upper Leg (Quad/Hamstring)
        const thighGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.5, 12);
        addPart(thighGeo, muscleMaterial, 0, -0.25, 0, "Leg/Thigh", legGroup);

        // Knee
        addPart(new THREE.SphereGeometry(0.11), jointMaterial, 0, -0.55, 0, "Leg/Knee", legGroup);

        // Lower Leg (Calf)
        const calfGeo = new THREE.CylinderGeometry(0.1, 0.07, 0.5, 12);
        addPart(calfGeo, muscleMaterial, 0, -0.85, 0, "Leg/Calf", legGroup);

        // Foot
        const footGeo = new THREE.BoxGeometry(0.12, 0.1, 0.25);
        addPart(footGeo, jointMaterial, 0, -1.15, 0.05, "Leg/Foot", legGroup);
    }
    createLeg(1);  // Right Leg
    createLeg(-1); // Left Leg

    humanModel = group;
    // Lower slightly so feet are near 0
    humanModel.position.y = -0.4; // Ground feet

    sceneRef.add(humanModel);
    console.log("Loaded Procedural Muscle Man");
    animate();
}

// ensure we call correct function
createMuscleMan(scene);


// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Interaction Logic
const neckInput = document.getElementById('neckInput');
const backInput = document.getElementById('backInput');
const eyeInput = document.getElementById('eyeInput');

function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!humanModel) return;

    const intersects = raycaster.intersectObjects(humanModel.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        const name = object.name || "";

        let type = '';

        if (name.includes("Head") || name.includes("Eye")) {
            type = 'Head/Eyes';
            highlightBodyPart(0xff0000, object);
            incrementInput(eyeInput);
            showFeedback("Eye Strain Recorded!");
        }
        else if (name.includes("Neck")) {
            type = 'Neck';
            highlightBodyPart(0xffaa00, object);
            incrementInput(neckInput);
            showFeedback("Neck Pain Recorded!");
        }
        else if (name.includes("Back") || name.includes("Torso") || name.includes("Chest")) {
            type = 'Back/Torso';
            highlightBodyPart(0x0000ff, object);
            incrementInput(backInput);
            showFeedback("Back Pain Recorded!");
        }
        else if (name.includes("Arm")) {
            // Map Arm pain to Neck/Shoulder tension
            type = 'Arms';
            highlightBodyPart(0xffaa00, object);
            incrementInput(neckInput);
            showFeedback("Arm/Shoulder Strain -> Neck Input");
        }
        else if (name.includes("Leg")) {
            // Map Leg pain to Sitting/Back
            type = 'Legs';
            highlightBodyPart(0x0000ff, object);
            incrementInput(backInput);
            showFeedback("Leg Strain -> Back Input");
        }
    }
}

// Updated highlight to target specific mesh or whole group
function highlightBodyPart(colorHex, targetMesh) {
    if (!targetMesh) return;

    // Flash just the clicked part
    const originalEmissive = targetMesh.material.emissive.getHex();
    targetMesh.material.emissive.setHex(colorHex);
    setTimeout(() => {
        targetMesh.material.emissive.setHex(originalEmissive);
    }, 300);
}

function incrementInput(input) {
    let val = parseInt(input.value) || 0;
    if (val < 10) {
        input.value = val + 1;
        // Trigger a visual pulse on the input
        input.style.border = "2px solid red";
        setTimeout(() => input.style.border = "1px solid gray", 300);
    }
}

// Duplicate highlightBodyPart removed

function showFeedback(text) {
    const div = document.createElement('div');
    div.innerText = text;
    div.style.position = 'absolute';
    div.style.top = '10%';
    div.style.left = '50%';
    div.style.transform = 'translateX(-50%)';
    div.style.background = 'rgba(0,0,0,0.7)';
    div.style.color = 'white';
    div.style.padding = '10px 20px';
    div.style.borderRadius = '5px';
    div.style.pointerEvents = 'none';
    container.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

// Add event listener
container.addEventListener('mousedown', onMouseClick); // Use mousedown for immediate response

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
