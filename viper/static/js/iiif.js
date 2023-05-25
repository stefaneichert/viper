var mirador = Mirador.viewer({
    "selectedTheme": "dark",
    "id": "my-mirador",
    "windows": [
        {
            "manifestId": img_manifest
        }
    ],
    availableLanguages: { // All the languages available in the language switcher
    en: 'English'},
    window: {
        allowClose: true,
    },
    workspace: {
        allowNewWindows: false,
        showZoomControls: false,
        type: 'mosaic', // Which workspace type to load by default. Other possible values are "elastic"
    },
    workspaceControlPanel: {
        enabled: true,
    }
});