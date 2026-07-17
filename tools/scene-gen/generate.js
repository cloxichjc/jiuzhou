/**
 * 场景文件生成器：按 Cocos Creator 3.8 序列化格式生成 6 个真实 .scene。
 *
 * 模板结构取自引擎内置 2D 场景（library 中的 scene-2d 导入产物）：
 * SceneAsset -> Scene -> Canvas(Camera + Root[挂载 SceneBinder]) + SceneGlobals。
 * 每个场景只有 Canvas / 2D Camera / 一个 Root 节点，UI 全部由 binder 代码构建。
 *
 * 用法：node tools/scene-gen/generate.js
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SCENES_DIR = path.join(ROOT, 'assets/scenes');
const UI_SCRIPTS_DIR = path.join(ROOT, 'assets/scripts/ui');

const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 1280;

const SCENE_BINDERS = {
  Boot: 'BootSceneBinder',
  MainMenu: 'MainMenuSceneBinder',
  HeroSelect: 'HeroSelectSceneBinder',
  Chapter: 'ChapterSceneBinder',
  Battle: 'BattleSceneBinder',
  Result: 'ResultSceneBinder'
};

function randomHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes; i += 1) {
    out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return out;
}

function uuid() {
  return `${randomHex(4)}-${randomHex(2)}-${randomHex(2)}-${randomHex(2)}-${randomHex(6)}`;
}

function vec3(x, y, z) {
  return { __type__: 'cc.Vec3', x, y, z };
}

function readScriptUuid(binderName) {
  const metaPath = path.join(UI_SCRIPTS_DIR, `${binderName}.ts.meta`);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  if (!meta.uuid) {
    throw new Error(`no uuid in ${metaPath}`);
  }
  return meta.uuid;
}

function readSceneUuid(sceneName) {
  const metaPath = path.join(SCENES_DIR, `${sceneName}.scene.meta`);
  if (!fs.existsSync(metaPath)) {
    return uuid();
  }
  return JSON.parse(fs.readFileSync(metaPath, 'utf8')).uuid ?? uuid();
}

function buildScene(sceneName, binderName) {
  const scriptUuid = readScriptUuid(binderName);
  const sceneUuid = readSceneUuid(sceneName);

  const cameraNodeId = uuid();
  const canvasNodeId = uuid();
  const rootNodeId = uuid();

  const sceneGlobalsIds = {
    globals: uuid(),
    ambient: uuid(),
    shadows: uuid(),
    skybox: uuid(),
    fog: uuid(),
    octree: uuid(),
    skin: uuid()
  };

  return [
    {
      __type__: 'cc.SceneAsset',
      _name: sceneName,
      _objFlags: 0,
      _native: '',
      scene: { __id__: 1 }
    },
    {
      __type__: 'cc.Scene',
      _name: sceneName,
      _objFlags: 0,
      _parent: null,
      _children: [{ __id__: 2 }],
      _active: true,
      _components: [],
      _prefab: null,
      autoReleaseAssets: false,
      _globals: { __id__: 9 },
      _id: sceneUuid
    },
    {
      __type__: 'cc.Node',
      _name: 'Canvas',
      _objFlags: 0,
      _parent: { __id__: 1 },
      _children: [{ __id__: 3 }, { __id__: 5 }],
      _active: true,
      _components: [{ __id__: 6 }, { __id__: 7 }, { __id__: 8 }],
      _prefab: null,
      _lpos: vec3(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 0),
      _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
      _lscale: vec3(1, 1, 1),
      _layer: 33554432,
      _euler: vec3(0, 0, 0),
      _id: canvasNodeId
    },
    {
      __type__: 'cc.Node',
      _name: 'Camera',
      _objFlags: 0,
      _parent: { __id__: 2 },
      _children: [],
      _active: true,
      _components: [{ __id__: 4 }],
      _prefab: null,
      _lpos: vec3(0, 0, 0),
      _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
      _lscale: vec3(1, 1, 1),
      _layer: 1073741824,
      _euler: vec3(0, 0, 0),
      _id: cameraNodeId
    },
    {
      __type__: 'cc.Camera',
      _name: '',
      _objFlags: 0,
      node: { __id__: 3 },
      _enabled: true,
      __prefab: null,
      _projection: 0,
      _priority: 0,
      _fov: 45,
      _fovAxis: 0,
      _orthoHeight: 10,
      _near: 0,
      _far: 2000,
      _color: { __type__: 'cc.Color', r: 0, g: 0, b: 0, a: 255 },
      _depth: 1,
      _stencil: 0,
      _clearFlags: 7,
      _rect: { __type__: 'cc.Rect', x: 0, y: 0, width: 1, height: 1 },
      _aperture: 19,
      _shutter: 7,
      _iso: 0,
      _screenScale: 1,
      _visibility: 1108344832,
      _targetTexture: null,
      _id: uuid()
    },
    {
      __type__: 'cc.Node',
      _name: 'Root',
      _objFlags: 0,
      _parent: { __id__: 2 },
      _children: [],
      _active: true,
      _components: [{ __id__: 10 }, { __id__: 11 }],
      _prefab: null,
      _lpos: vec3(0, 0, 0),
      _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
      _lscale: vec3(1, 1, 1),
      _layer: 33554432,
      _euler: vec3(0, 0, 0),
      _id: rootNodeId
    },
    {
      __type__: 'cc.UITransform',
      _name: '',
      _objFlags: 0,
      node: { __id__: 2 },
      _enabled: true,
      __prefab: null,
      _contentSize: { __type__: 'cc.Size', width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
      _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
      _id: uuid()
    },
    {
      __type__: 'cc.Canvas',
      _name: '',
      _objFlags: 0,
      node: { __id__: 2 },
      _enabled: true,
      __prefab: null,
      _cameraComponent: { __id__: 4 },
      _alignCanvasWithScreen: true,
      _id: uuid()
    },
    {
      __type__: 'cc.Widget',
      _name: '',
      _objFlags: 0,
      node: { __id__: 2 },
      _enabled: true,
      __prefab: null,
      _alignFlags: 45,
      _target: null,
      _left: 0,
      _right: 0,
      _top: 0,
      _bottom: 0,
      _horizontalCenter: 0,
      _verticalCenter: 0,
      _isAbsLeft: true,
      _isAbsRight: true,
      _isAbsTop: true,
      _isAbsBottom: true,
      _isAbsHorizontalCenter: true,
      _isAbsVerticalCenter: true,
      _originalWidth: 0,
      _originalHeight: 0,
      _alignMode: 2,
      _lockFlags: 0,
      _id: uuid()
    },
    {
      __type__: 'cc.SceneGlobals',
      ambient: { __id__: 12 },
      shadows: { __id__: 13 },
      _skybox: { __id__: 14 },
      fog: { __id__: 15 },
      octree: { __id__: 16 },
      skin: { __id__: 17 },
      _id: sceneGlobalsIds.globals
    },
    {
      __type__: 'cc.UITransform',
      _name: '',
      _objFlags: 0,
      node: { __id__: 5 },
      _enabled: true,
      __prefab: null,
      _contentSize: { __type__: 'cc.Size', width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
      _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
      _id: uuid()
    },
    {
      __type__: scriptUuid,
      _name: '',
      _objFlags: 0,
      node: { __id__: 5 },
      _enabled: true,
      __prefab: null,
      _id: uuid()
    },
    {
      __type__: 'cc.AmbientInfo',
      _skyColorHDR: { __type__: 'cc.Vec4', x: 0, y: 0, z: 0, w: 0.520833125 },
      _skyColor: { __type__: 'cc.Vec4', x: 0, y: 0, z: 0, w: 0.520833125 },
      _skyIllumHDR: 20000,
      _skyIllum: 20000,
      _groundAlbedoHDR: { __type__: 'cc.Vec4', x: 0, y: 0, z: 0, w: 0 },
      _groundAlbedo: { __type__: 'cc.Vec4', x: 0, y: 0, z: 0, w: 0 },
      _skyColorLDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.5, z: 0.8, w: 1 },
      _skyIllumLDR: 20000,
      _groundAlbedoLDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
      _id: sceneGlobalsIds.ambient
    },
    {
      __type__: 'cc.ShadowsInfo',
      _enabled: false,
      _type: 0,
      _normal: vec3(0, 1, 0),
      _distance: 0,
      _shadowColor: { __type__: 'cc.Color', r: 76, g: 76, b: 76, a: 255 },
      _maxReceived: 4,
      _size: { __type__: 'cc.Vec2', x: 512, y: 512 },
      _id: sceneGlobalsIds.shadows
    },
    {
      __type__: 'cc.SkyboxInfo',
      _envLightingType: 0,
      _envmapHDR: null,
      _envmap: null,
      _envmapLDR: null,
      _diffuseMapHDR: null,
      _diffuseMapLDR: null,
      _enabled: false,
      _useHDR: true,
      _id: sceneGlobalsIds.skybox
    },
    {
      __type__: 'cc.FogInfo',
      _type: 0,
      _fogColor: { __type__: 'cc.Color', r: 200, g: 200, b: 200, a: 255 },
      _enabled: false,
      _fogDensity: 0.3,
      _fogStart: 0.5,
      _fogEnd: 300,
      _fogAtten: 5,
      _fogTop: 1.5,
      _fogRange: 1.2,
      _accurate: false,
      _id: sceneGlobalsIds.fog
    },
    {
      __type__: 'cc.OctreeInfo',
      _enabled: false,
      _minPos: vec3(-1024, -1024, -1024),
      _maxPos: vec3(1024, 1024, 1024),
      _depth: 8,
      _id: sceneGlobalsIds.octree
    },
    {
      __type__: 'cc.SkinInfo',
      _enabled: false,
      _scale: 5,
      _id: sceneGlobalsIds.skin
    }
  ];
}

function validateScene(sceneName, data) {
  const ids = new Set(data.keys());
  const refs = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      if (typeof value.__id__ === 'number') refs.push(value.__id__);
      Object.values(value).forEach(walk);
    }
  };
  walk(data);

  const missing = refs.filter((ref) => !ids.has(ref));
  if (missing.length > 0) {
    throw new Error(`${sceneName}: unresolved __id__ refs: ${missing.join(', ')}`);
  }
}

function main() {
  for (const [sceneName, binderName] of Object.entries(SCENE_BINDERS)) {
    const data = buildScene(sceneName, binderName);
    validateScene(sceneName, data);
    const file = path.join(SCENES_DIR, `${sceneName}.scene`);
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`${sceneName}.scene  (${data.length} objects, binder ${binderName})`);
  }
  console.log('done: 6 scenes');
}

main();
