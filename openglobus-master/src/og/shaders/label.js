/**
 * @module og/shaders/label
 */

'use strict';

import { Program } from '../webgl/Program.js';

const DEFINE = `
#define EMPTY -1.0
#define RTL 1.0`;

const PROJECT = `vec2 project(vec4 p) {
                    return (0.5 * p.xyz / p.w + 0.5).xy * viewport;
                }`;

const ROTATE2D =
    `mat2 rotate2d(float angle) {
        return mat2(cos(angle), -sin(angle),
           sin(angle), cos(angle));
     }`;

export function label_webgl2() {
    return new Program("label", {
        uniforms: {
            viewport: "vec2",
            fontTextureArr: "sampler2darray",
            sdfParamsArr: "vec4",
            projectionMatrix: "mat4",
            viewMatrix: "mat4",
            eyePositionHigh: "vec3",
            eyePositionLow: "vec3",
            planetRadius: "float",
            scaleByDistance: "vec3",
            opacity: "float",
            isOutlinePass: "int",
            depthOffset: "float"
        },
        attributes: {
            a_outline: "float",
            a_gliphParam: "vec4",
            a_vertices: "vec2",
            a_texCoord: "vec4",
            a_positionsHigh: "vec3",
            a_positionsLow: "vec3",
            a_size: "float",
            a_rotation: "float",
            a_rgba: "vec4",
            a_offset: "vec3",
            a_fontIndex: "float"
        },
        vertexShader:
            `#version 300 es
            
            ${DEFINE}
            
            in float a_outline;
            in vec4 a_gliphParam;
            in vec2 a_vertices;
            in vec4 a_texCoord;
            in vec3 a_positionsHigh;
            in vec3 a_positionsLow;
            in vec3 a_offset;
            in float a_size;
            in float a_rotation;
            in vec4 a_rgba;
            in float a_fontIndex;

            out vec2 v_uv;
            out vec4 v_rgba;
            flat out int v_fontIndex;            
            out vec4 v_outlineColor;
            flat out float v_outline;

            uniform vec2 viewport;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform vec3 eyePositionHigh;
            uniform vec3 eyePositionLow;
            uniform float planetRadius;
            uniform vec3 scaleByDistance;
            uniform float opacity;
            uniform float depthOffset;

            const vec3 ZERO3 = vec3(0.0);
           
            ${PROJECT}

            ${ROTATE2D}

            void main() {

                if(a_texCoord.w == EMPTY) {
                    gl_Position = vec4(0.0);
                    v_fontIndex = -1;
                    return;
                }
               
                vec3 a_positions = a_positionsHigh + a_positionsLow;
                vec3 cameraPos = eyePositionHigh + eyePositionLow;

                v_outline = a_outline;

                v_fontIndex = int(a_fontIndex);
                v_uv = a_texCoord.xy;
                vec3 look = a_positions - cameraPos;
                float lookDist = length(look);
                v_rgba = a_rgba;
                
                if(opacity * step(lookDist, sqrt(dot(cameraPos,cameraPos) - planetRadius) + sqrt(dot(a_positions,a_positions) - planetRadius)) == 0.0){
                    return;
                }

                float scd = (1.0 - smoothstep(scaleByDistance[0], scaleByDistance[1], lookDist)) * (1.0 - step(scaleByDistance[2], lookDist));

                v_rgba.a *= opacity;

                mat4 viewMatrixRTE = viewMatrix;
                viewMatrixRTE[3] = vec4(0.0, 0.0, 0.0, 1.0);

                vec3 highDiff = a_positionsHigh - eyePositionHigh;
                vec3 lowDiff = a_positionsLow - eyePositionLow;
                vec4 posRTE = viewMatrixRTE * vec4(highDiff + lowDiff, 1.0);
                vec4 projPos = projectionMatrix * posRTE;
                                
                float camSlope = dot(vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]), normalize(cameraPos));                
                if(camSlope > 0.5) {
                    float dist = dot(look, normalize(cameraPos));
                    projPos.z += dist * 0.02;                  
                }else{
                    projPos.z += -(abs(projPos.z)) * 0.002;                 
                }
                        
                projPos.z += depthOffset + a_offset.z;
                               
                vec2 screenPos = project(projPos);
                
                vec2 vert = a_vertices;                
                vec4 gp = a_gliphParam;                                
                if(a_texCoord.w == RTL){
                    vert.x = step(vert.x * 0.5 + 1.0, 1.0);
                    gp.x = -a_gliphParam.x;
                    gp.z = -(a_gliphParam.z + a_texCoord.z);
                }else{
                    gp.z = a_gliphParam.z + a_texCoord.z;
                }
                                
                vec2 v = screenPos + rotate2d(a_rotation) * ((vert * gp.xy + gp.zw) * a_size * scd + a_offset.xy);

                gl_Position = vec4((2.0 * v / viewport - 1.0) * projPos.w, projPos.z, projPos.w);
            }`,
        fragmentShader:
            `#version 300 es

            uniform int isOutlinePass;
            
            precision highp float;

            const int MAX_SIZE = 11;

            // x - ATLAS_WIDTH = 512.0;
            // y - ATLAS_HEIGHT = 512.0;
            // z - ATLAS_GLYPH_SIZE = 32.0;
            // w - ATLAS_FIELD_RANGE = 8.0;

            uniform sampler2D fontTextureArr[MAX_SIZE];
            uniform vec4 sdfParamsArr[MAX_SIZE];

            flat in int v_fontIndex;
            in vec2 v_uv;
            in vec4 v_rgba;           

            flat in float v_outline;

            in vec3 v_pickingColor;

            layout(location = 0) out vec4 outScreen;

            float median(float r, float g, float b) {
                return max(min(r, g), min(max(r, g), b));
            }

            float getDistance() {
                vec3 msdf;
                if(v_fontIndex == 0) {
                    msdf = texture(fontTextureArr[0], v_uv).rgb;
                } else if(v_fontIndex == 1){
                    msdf = texture(fontTextureArr[1], v_uv).rgb;
                } else if(v_fontIndex == 2){
                    msdf = texture(fontTextureArr[2], v_uv).rgb;
                } else if(v_fontIndex == 3){
                    msdf = texture(fontTextureArr[3], v_uv).rgb;
                } else if(v_fontIndex == 4){
                    msdf = texture(fontTextureArr[4], v_uv).rgb;
                } else if(v_fontIndex == 5){
                    msdf = texture(fontTextureArr[5], v_uv).rgb;
                } else if(v_fontIndex == 6){
                    msdf = texture(fontTextureArr[6], v_uv).rgb;
                } else if(v_fontIndex == 7){
                    msdf = texture(fontTextureArr[7], v_uv).rgb;
                } else if(v_fontIndex == 8){
                    msdf = texture(fontTextureArr[8], v_uv).rgb;
                } else if(v_fontIndex == 9){
                    msdf = texture(fontTextureArr[9], v_uv).rgb;
                } else if(v_fontIndex == 10){
                    msdf = texture(fontTextureArr[10], v_uv).rgb;
                }
                return median(msdf.r, msdf.g, msdf.b);
            }
                        
            void main () {
            
                if(v_fontIndex == -1) {
                    return;
                }
                
                vec4 sdfParams = sdfParamsArr[v_fontIndex];
                float sd = getDistance();             
                vec2 dxdy = fwidth(v_uv) * sdfParams.xy;

                if(isOutlinePass == 0){                             
                    float dist = sd + min(0.001, 0.5 - 1.0 / sdfParams.w) - 0.5;
                    float opacity = clamp(dist * sdfParams.w / length(dxdy) + 0.5, 0.0, 1.0);
                    if(opacity <= 0.1){
                        discard;
                    }
                    outScreen = vec4(v_rgba.rgb, opacity * v_rgba.a);
                } else {             
                    float dist = sd + min(v_outline, 0.5 - 1.0 / sdfParams.w) - 0.5;
                    float opacity = clamp(dist * sdfParams.w / length(dxdy) + 0.5, 0.0, 1.0);                       
                    if(opacity <= 0.1){
                        discard;
                    }
                    outScreen = vec4(v_rgba.rgb, opacity * v_rgba.a);
                    //outScreen = v_rgba * strokeAlpha * (0.5 - opacity) * 2.0;
                }         
            }`
    });
}

export function label_screen() {
    return new Program("label", {
        uniforms: {
            viewport: "vec2",
            fontTextureArr: "sampler2darray",
            sdfParamsArr: "vec4",
            projectionMatrix: "mat4",
            viewMatrix: "mat4",
            eyePositionHigh: "vec3",
            eyePositionLow: "vec3",
            planetRadius: "float",
            scaleByDistance: "vec3",
            opacity: "float",
            isOutlinePass: "int",
            depthOffset: "float"
        },
        attributes: {
            a_outline: "float",
            a_gliphParam: "vec4",
            a_vertices: "vec2",
            a_texCoord: "vec4",
            a_positionsHigh: "vec3",
            a_positionsLow: "vec3",
            a_size: "float",
            a_rotation: "float",
            a_rgba: "vec4",
            a_offset: "vec3",
            a_fontIndex: "float"
        },
        vertexShader:
            `            
            ${DEFINE}
                        
            attribute float a_outline;
            attribute vec4 a_gliphParam;
            attribute vec2 a_vertices;
            attribute vec4 a_texCoord;
            attribute vec3 a_positionsHigh;
            attribute vec3 a_positionsLow;
            attribute vec3 a_offset;
            attribute float a_size;
            attribute float a_rotation;
            attribute vec4 a_rgba;
            attribute float a_fontIndex;

            varying float v_outline;
            varying vec2 v_uv;
            varying vec4 v_rgba;
            varying float v_fontIndex;            

            uniform vec2 viewport;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform vec3 eyePositionHigh;
            uniform vec3 eyePositionLow;
            uniform float planetRadius;
            uniform vec3 scaleByDistance;
            uniform float opacity;
            uniform float depthOffset;

            const vec3 ZERO3 = vec3(0.0);

            ${PROJECT}

            ${ROTATE2D}

            void main() {

                if(a_texCoord.w == EMPTY) {
                    gl_Position = vec4(0.0);
                    v_fontIndex = -1.0;
                    return;
                }
               
                vec3 a_positions = a_positionsHigh + a_positionsLow;
                vec3 cameraPos = eyePositionHigh + eyePositionLow;

                v_outline = a_outline;
                v_uv = vec2(a_texCoord.xy);
                v_rgba = a_rgba;
                v_fontIndex = a_fontIndex;
                
                vec3 look = a_positions - cameraPos;
                float lookDist = length(look);
                
                if(opacity * step(lookDist, sqrt(dot(cameraPos,cameraPos) - planetRadius) + sqrt(dot(a_positions,a_positions) - planetRadius)) == 0.0){
                    return;
                }

                float scd = (1.0 - smoothstep(scaleByDistance[0], scaleByDistance[1], lookDist)) * (1.0 - step(scaleByDistance[2], lookDist));

                v_rgba.a *= opacity;

                mat4 viewMatrixRTE = viewMatrix;
                viewMatrixRTE[3] = vec4(0.0, 0.0, 0.0, 1.0);

                vec3 highDiff = a_positionsHigh - eyePositionHigh;
                vec3 lowDiff = a_positionsLow - eyePositionLow;
                vec4 posRTE = viewMatrixRTE * vec4(highDiff + lowDiff, 1.0);
                vec4 projPos = projectionMatrix * posRTE;
                                
                float camSlope = dot(vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]), normalize(cameraPos));                
                if(camSlope > 0.5) {
                    float dist = dot(look, normalize(cameraPos));
                    projPos.z += dist * 0.02;                  
                }else{
                    projPos.z += -(abs(projPos.z)) * 0.002;                 
                }
                        
                projPos.z += depthOffset + a_offset.z;
                               
                vec2 screenPos = project(projPos);
                
                vec2 vert = a_vertices;                
                vec4 gp = a_gliphParam;                                
                if(a_texCoord.w == RTL){
                    vert.x = step(vert.x * 0.5 + 1.0, 1.0);
                    gp.x = -a_gliphParam.x;
                    gp.z = -(a_gliphParam.z + a_texCoord.z);
                }else{
                    gp.z = a_gliphParam.z + a_texCoord.z;
                }
                                
                vec2 v = screenPos + rotate2d(a_rotation) * ((vert * gp.xy + gp.zw) * a_size * scd + a_offset.xy);
                
                gl_Position = vec4((2.0 * v / viewport - 1.0) * projPos.w, projPos.z, projPos.w);
            }`,
        fragmentShader:
            `#extension GL_OES_standard_derivatives : enable

            precision highp float;
            precision highp int;

            const int MAX_SIZE = 11;

            // x - ATLAS_WIDTH = 512.0;
            // y - ATLAS_HEIGHT = 512.0;
            // z - ATLAS_GLYPH_SIZE = 32.0;
            // w - ATLAS_FIELD_RANGE = 8.0;

            uniform sampler2D fontTextureArr[MAX_SIZE];
            uniform vec4 sdfParamsArr[MAX_SIZE];
            uniform int isOutlinePass;
            
            varying float v_outline;
            varying vec2 v_uv;
            varying vec4 v_rgba;           
            varying float v_fontIndex;
            
            float fontIndex;

            float median(float r, float g, float b) {
                return max(min(r, g), min(max(r, g), b));
            }

            float getDistance() {
                vec3 msdf;
                if(fontIndex >= 0.0 && fontIndex < 1.0) {
                    msdf = texture2D(fontTextureArr[0], v_uv).rgb;
                } else if(fontIndex >= 1.0 && fontIndex < 2.0){
                    msdf = texture2D(fontTextureArr[1], v_uv).rgb;
                } else if(fontIndex >= 2.0 && fontIndex < 3.0){
                    msdf = texture2D(fontTextureArr[2], v_uv).rgb;
                } else if(fontIndex >= 3.0 && fontIndex < 4.0){
                    msdf = texture2D(fontTextureArr[3], v_uv).rgb;
                } else if(fontIndex >= 4.0 && fontIndex < 5.0){
                    msdf = texture2D(fontTextureArr[4], v_uv).rgb;
                } else if(fontIndex >= 5.0 && fontIndex < 6.0){
                    msdf = texture2D(fontTextureArr[5], v_uv).rgb;
                } else if(fontIndex >= 6.0 && fontIndex < 7.0){
                    msdf = texture2D(fontTextureArr[6], v_uv).rgb;
                } else if(fontIndex >= 7.0 && fontIndex < 8.0){
                    msdf = texture2D(fontTextureArr[7], v_uv).rgb;
                } else if(fontIndex >= 8.0 && fontIndex < 9.0){
                    msdf = texture2D(fontTextureArr[8], v_uv).rgb;
                } else if(fontIndex >= 9.0 && fontIndex < 10.0){
                    msdf = texture2D(fontTextureArr[9], v_uv).rgb;
                } else if(fontIndex >= 10.0 && fontIndex < 11.0){
                    msdf = texture2D(fontTextureArr[10], v_uv).rgb;
                }
                return median(msdf.r, msdf.g, msdf.b);
            }


            vec4 getSDFParams() {
                if(fontIndex >= 0.0 && fontIndex < 1.0) {
                    return sdfParamsArr[0];
                } else if(fontIndex >= 1.0 && fontIndex < 2.0){
                    return sdfParamsArr[1];
                } else if(fontIndex >= 2.0 && fontIndex < 3.0){
                    return sdfParamsArr[2];
                } else if(fontIndex >= 3.0 && fontIndex < 4.0){
                    return sdfParamsArr[3];
                } else if(fontIndex >= 4.0 && fontIndex < 5.0){
                    return sdfParamsArr[4];
                } else if(fontIndex >= 5.0 && fontIndex < 6.0){
                    return sdfParamsArr[5];
                } else if(fontIndex >= 6.0 && fontIndex < 7.0){
                    return sdfParamsArr[6];
                } else if(fontIndex >= 7.0 && fontIndex < 8.0){
                    return sdfParamsArr[7];
                } else if(fontIndex >= 8.0 && fontIndex < 9.0){
                    return sdfParamsArr[8];
                } else if(fontIndex >= 9.0 && fontIndex < 10.0){
                    return sdfParamsArr[9];
                } else if(fontIndex >= 10.0 && fontIndex < 11.0){
                    return sdfParamsArr[10];
                }
            }
                    
            void main () {

                fontIndex = v_fontIndex + 0.1;
                
                if(v_fontIndex < 0.0){
                    return;
                }
                
                vec4 sdfParams = getSDFParams();
                float sd = getDistance();             
                vec2 dxdy = fwidth(v_uv) * sdfParams.xy;
                float dist = sd + min(0.001, 0.5 - 1.0 / sdfParams.w) - 0.5;
                float opacity = clamp(dist * sdfParams.w / length(dxdy) + 0.5, 0.0, 1.0);

                if(isOutlinePass == 0){                             
                    //gl_FragColor = vec4(v_rgba.rgb, opacity * v_rgba.a);
                } else {                
                    float strokeDist = sd + min(v_outline, 0.5 - 1.0 / sdfParams.w) - 0.5;
                    float strokeAlpha = v_rgba.a * clamp(strokeDist * sdfParams.w / length(dxdy) + 0.5, 0.0, 1.0);                    
                    if(strokeAlpha < 0.1){
                        discard;
                    }
                    //gl_FragColor = v_rgba * strokeAlpha * (0.5 - opacity) * 2.0;
                }
            }`
    });
}

export function labelPicking() {
    return new Program("labelPicking", {
        uniforms: {
            viewport: "vec2",
            projectionMatrix: "mat4",
            viewMatrix: "mat4",
            eyePositionHigh: "vec3",
            eyePositionLow: "vec3",
            planetRadius: "float",
            scaleByDistance: "vec3",
            opacity: "float",
            depthOffset: "float"
        },
        attributes: {
            a_gliphParam: "vec4",
            a_vertices: "vec2",
            a_texCoord: "vec4",
            a_positionsHigh: "vec3",
            a_positionsLow: "vec3",
            a_offset: "vec3",
            a_size: "float",
            a_rotation: "float",
            a_rgba: "vec4"
        },
        vertexShader:
            `
            
            ${DEFINE}
            
            attribute vec4 a_gliphParam;
            attribute vec2 a_vertices;
            attribute vec4 a_texCoord;
            attribute vec3 a_positionsHigh;
            attribute vec3 a_positionsLow;
            attribute vec3 a_offset;
            attribute float a_size;
            attribute float a_rotation;
            attribute vec4 a_rgba;

            varying vec4 v_rgba;

            uniform vec2 viewport;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform vec3 eyePositionHigh;
            uniform vec3 eyePositionLow;
            uniform float planetRadius;
            uniform vec3 scaleByDistance;
            uniform float opacity;
            uniform float depthOffset;

            const vec3 ZERO3 = vec3(0.0);

            ${PROJECT}

            ${ROTATE2D}

            void main() {
                vec3 a_positions = a_positionsHigh + a_positionsLow;
                vec3 cameraPos = eyePositionHigh + eyePositionLow;
                v_rgba = a_rgba;
                
                if(a_texCoord.w == EMPTY) {
                    v_rgba.a = 0.0;
                    gl_Position = vec4(0.0);
                    return;
                }

                vec3 look = a_positions - cameraPos;
                float lookDist = length(look);
                if(opacity * step(lookDist, sqrt(dot(cameraPos,cameraPos) - planetRadius) + sqrt(dot(a_positions,a_positions) - planetRadius)) == 0.0){
                    return;
                }

                float scd = (1.0 - smoothstep(scaleByDistance[0], scaleByDistance[1], lookDist)) * (1.0 - step(scaleByDistance[2], lookDist));

                v_rgba.a *= opacity;

                mat4 viewMatrixRTE = viewMatrix;
                viewMatrixRTE[3] = vec4(0.0, 0.0, 0.0, 1.0);

                vec3 highDiff = a_positionsHigh - eyePositionHigh;
                vec3 lowDiff = a_positionsLow - eyePositionLow;
                vec4 posRTE = viewMatrixRTE * vec4(highDiff + lowDiff, 1.0);
                vec4 projPos = projectionMatrix * posRTE;
                
                float camSlope = dot(vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]), normalize(cameraPos));                
                if(camSlope > 0.5) {
                    float dist = dot(look, normalize(cameraPos));
                    projPos.z += dist * 0.02;                  
                }else{
                    projPos.z += -(abs(projPos.z)) * 0.002;                 
                }
                        
                projPos.z += depthOffset + a_offset.z;
                
                vec2 screenPos = project(projPos);
                
                vec2 vert = a_vertices;                
                vec4 gp = a_gliphParam;                                
                if(a_texCoord.w == RTL){
                    vert.x = step(vert.x * 0.5 + 1.0, 1.0);
                    gp.x = -a_gliphParam.x;
                    gp.z = -(a_gliphParam.z + a_texCoord.z);
                }else{
                    gp.z = a_gliphParam.z + a_texCoord.z;
                }
                                
                vec2 v = screenPos + rotate2d(a_rotation) * ((vert * gp.xy + gp.zw) * a_size * scd + a_offset.xy);
                                
                gl_Position = vec4((2.0 * v / viewport - 1.0) * projPos.w, projPos.z, projPos.w);
            }`,
        fragmentShader:
            `precision highp float;

            varying vec4 v_rgba;

            varying vec3 v_pickingColor;

            void main () {

                vec4 color = v_rgba;
                if (color.a < 0.05) {
                    return;
                }

                gl_FragColor = vec4(v_rgba.rgb, v_rgba.a);
            }`
    });
}