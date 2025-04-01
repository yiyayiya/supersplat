// Three.js 使用场景图系统
// 创建对象
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

// 添加到场景
scene.add(cube);

// 处理逻辑需要在渲染循环中手动完成
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    renderer.render(scene, camera);
}
