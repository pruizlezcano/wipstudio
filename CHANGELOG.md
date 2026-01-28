# Changelog

[0.4.0](https://github.com/pruizlezcano/wipstudio/compare/v0.3.0...v0.4.0) (2026-01-28)


### Features

* add ErrorState component and global error handling ([c668f23](https://github.com/pruizlezcano/wipstudio/commit/c668f232dd5257f6b1a601f7928d96b6a3d80d6b))
* add lastVersionAt and update sorting for projects and tracks ([ea4c961](https://github.com/pruizlezcano/wipstudio/commit/ea4c9610f2656799351b8178b0a80219053bbb16))
* display stacked user avatars for project participants on project cards ([6d585df](https://github.com/pruizlezcano/wipstudio/commit/6d585df8929d3196a2f246821431b1ff96a93670))
* **projects:** displayrefactor: implement ApiError and status-based retry logic ([1c27e63](https://github.com/pruizlezcano/wipstudio/commit/1c27e635e3fa5d2f88cfae4bc92ec6035245e650))
* **tracks:** add track version download ([54aad0c](https://github.com/pruizlezcano/wipstudio/commit/54aad0c0db602fe9a167b04d062836b77644d735))


### Bug Fixes

* **hooks:** invalidate project lists after collaborator removal and standardize project list invalidation using `projectKeys.lists()` on invitation acceptance ([7f163eb](https://github.com/pruizlezcano/wipstudio/commit/7f163ebc11e921776a387582769c9bb1995f0086))
* prevent duplicate audio requests by caching peaks ([4d5f812](https://github.com/pruizlezcano/wipstudio/commit/4d5f8121bbcc1a86f70014a2304556b7ffa98a53))
* **tracks:** missing version count in patch response ([19eee13](https://github.com/pruizlezcano/wipstudio/commit/19eee130ca1b33b0b8a87a54c8b5cd278d297c2a))

## [0.3.0](https://github.com/pruizlezcano/wipstudio/compare/v0.2.0...v0.3.0) (2026-01-15)


### Features

* **nav-bar:** add logo ([c5bd8ed](https://github.com/pruizlezcano/wipstudio/commit/c5bd8edfc7cafb3ddd28ac6b746a0b10d1044961))
* **projects:** navigate to new project on creation ([c09dcf7](https://github.com/pruizlezcano/wipstudio/commit/c09dcf73c5c106fce96ddcc843427225fb17cde1))
* **tracks:** navigate to new track after upload ([c6249f6](https://github.com/pruizlezcano/wipstudio/commit/c6249f65b2c95b3a505c073e67f0134f58feb4f0))


### Bug Fixes

* **tracks:** display updatedAt instead of createdAt ([9c08956](https://github.com/pruizlezcano/wipstudio/commit/9c08956160a92c54794c21168caf44e281c865a7))

## [0.2.0](https://github.com/pruizlezcano/wipstudio/compare/v0.1.0...v0.2.0) (2026-01-13)


### Features

* **projects:** add infinite scroll pagination ([b3aaa16](https://github.com/pruizlezcano/wipstudio/commit/b3aaa16a86a66630e8138533cd454595d1fb7924))
* **projects:** add project list sorting ([d6fb8bc](https://github.com/pruizlezcano/wipstudio/commit/d6fb8bc6530a95c329c2a638bf159d087c6e1032))
* **tracks:** add infinite scroll pagination ([1cc08da](https://github.com/pruizlezcano/wipstudio/commit/1cc08da7004111a28924fb39d24d7412aedd1d9b))
* **tracks:** add track sorting functionality ([a90429c](https://github.com/pruizlezcano/wipstudio/commit/a90429c967588f8e6d44ba45953ffa28f4e02d2d))


### Bug Fixes

* **env:** fixes Next.js runtime env var access ([f3e2b72](https://github.com/pruizlezcano/wipstudio/commit/f3e2b72f05214b104f6cbf4f8847ecd5d2456fa6))
