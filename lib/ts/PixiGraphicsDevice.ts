/**
 * Created by ROB3656 on 4-4-2018.
 */


export var debugphys2d_cgfx;

export interface GraphicsDevice {
    PRIMITIVE_LINES: number;
    width: number;
    height: number;
    createShader(params: any);
    setScissor(x, y, w, h);
    setTechnique(technique);
    setTechniqueParameters(/*indx, */techniqueParameters);
    createVertexBuffer(params /*: VertexBufferParameters*/) /*: WebGLVertexBuffer*/;
    createIndexBuffer(params /*: IndexBufferParameters*/ ) /*: WebGLIndexBuffer*/;
    setStream(vertexBuffer/*: VertexBuffer */,
        semantics /*: Semantics*/,
        offset? /*: number*/);
    setIndexBuffer(indexBuffer /*: IndexBuffer*/);
    drawIndexed(primitive: number, numIndices: number, first?: number);


    drawCircle(x, y, radius, color);
    drawLine(x1, y1, x2, y2, color);
    _drawPolygonShape(polygon, color);
    drawCurve(x1, y1, cx, cy, x2, y2, color);
    drawRectangle(x1, y1, x2, y2, color);
}

// export class GraphicsDevice {
//     PRIMITIVE_LINES          : number;
//
//     private _gl: WebGLRenderingContext;
//
//     constructor() {
//     }
//
//     render(gl) {
//
//     }
//
//     get width(): number {
//         throw "not implemeted";
//     }
//
//     get height(): number {
//         throw "not implemeted";
//     }
//
//     createShader(params: any) /*: TZWebGLShader*/
//     {
//         // return TZWebGLShader.create(this, params, onload);
//     }
//
//     setScissor(x, y, w, h)
//     {
//         // var currentBox = this._state.scissorBox;
//         // if (currentBox[0] !== x ||
//         //     currentBox[1] !== y ||
//         //     currentBox[2] !== w ||
//         //     currentBox[3] !== h)
//         // {
//         //     currentBox[0] = x;
//         //     currentBox[1] = y;
//         //     currentBox[2] = w;
//         //     currentBox[3] = h;
//         //     this._gl.scissor(x, y, w, h);
//         // }
//     }
//
//     setTechnique(technique)
//     {
//         // debug.assert(technique instanceof WebGLTechnique,
//         //     "argument must be a Technique");
//         //
//         // var activeTechnique = this._activeTechnique;
//         // if (activeTechnique !== technique)
//         // {
//         //     if (activeTechnique)
//         //     {
//         //         activeTechnique.deactivate();
//         //     }
//         //
//         //     this._activeTechnique = technique;
//         //
//         //     technique.activate(this);
//         //
//         //     var passes = technique.passes;
//         //     if (1 === passes.length)
//         //     {
//         //         this.setPass(passes[0]);
//         //     }
//         // }
//     }
//
//     setTechniqueParameters(/*indx, */techniqueParameters)
//     {
//         // debug.assert(indx < 8, "indx out of range");
//         // if (indx < 8)
//         // {
//         //     indx += (16 * 3);
//         //
//         //     var oldTechniqueParameters = this[indx];
//         //     if (oldTechniqueParameters !== techniqueParameters)
//         //     {
//         //         if (!oldTechniqueParameters ||
//         //             !techniqueParameters ||
//         //             this._differentParameters(oldTechniqueParameters, techniqueParameters))
//         //         {
//         //             this._parametersList.length = 0;
//         //         }
//         //         this[indx] = techniqueParameters;
//         //     }
//         //
//         //     var endTechniqueParameters = this._endTechniqueParameters;
//         //     if (techniqueParameters)
//         //     {
//         //         if (endTechniqueParameters <= indx)
//         //         {
//         //             this._endTechniqueParameters = (indx + 1);
//         //         }
//         //     }
//         //     else
//         //     {
//         //         while ((16 * 3) < endTechniqueParameters &&
//         //         !this[endTechniqueParameters - 1])
//         //         {
//         //             endTechniqueParameters -= 1;
//         //         }
//         //         this._endTechniqueParameters = endTechniqueParameters;
//         //     }
//         // }
//     }
//
//     createVertexBuffer(params /*: VertexBufferParameters*/) /*: WebGLVertexBuffer*/
//     {
//         // return WebGLVertexBuffer.create(this, params);
//     }
//
//     createIndexBuffer(params /*: IndexBufferParameters*/ ) /*: WebGLIndexBuffer*/
//     {
//         // return WebGLIndexBuffer.create(this, params);
//     }
//
//     setStream(vertexBuffer/*: VertexBuffer */,
//               semantics /*: Semantics*/,
//               offset? /*: number*/)
//     {
//         // if (debug)
//         // {
//         //     debug.assert(vertexBuffer instanceof WebGLVertexBuffer);
//         //     debug.assert(semantics instanceof WebGLSemantics);
//         // }
//         //
//         // if (offset)
//         // {
//         //     offset *= (<WebGLVertexBuffer>vertexBuffer)._strideInBytes;
//         // }
//         // else
//         // {
//         //     offset = 0;
//         // }
//         //
//         // this.bindVertexBuffer((<WebGLVertexBuffer>vertexBuffer)._glBuffer);
//         //
//         // /* tslint:disable:no-bitwise */
//         // this._attributeMask |=
//         //     (<WebGLVertexBuffer>vertexBuffer).bindAttributesCached((<WebGLSemantics>semantics), offset);
//         // /* tslint:enable:no-bitwise */
//     }
//
//     setIndexBuffer(indexBuffer /*: IndexBuffer*/)
//     {
//         // if (this._activeIndexBuffer !== <WebGLIndexBuffer>indexBuffer)
//         // {
//         //     this._activeIndexBuffer = <WebGLIndexBuffer>indexBuffer;
//         //     var glBuffer;
//         //     if (indexBuffer)
//         //     {
//         //         glBuffer = (<WebGLIndexBuffer>indexBuffer)._glBuffer;
//         //     }
//         //     else
//         //     {
//         //         glBuffer = null;
//         //     }
//         //     var gl = this._gl;
//         //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer);
//         //
//         //     if (debug)
//         //     {
//         //         this.metrics.indexBufferChanges += 1;
//         //     }
//         // }
//     }
//
//     drawIndexed(primitive: number, numIndices: number, first?: number)
//     {
//         // var gl = this._gl;
//         // var indexBuffer = this._activeIndexBuffer;
//         //
//         // var offset;
//         // if (first)
//         // {
//         //     offset = (first * indexBuffer._stride);
//         // }
//         // else
//         // {
//         //     offset = 0;
//         // }
//         //
//         // var format = indexBuffer.format;
//         //
//         // var attributeMask = this._attributeMask;
//         //
//         // var activeTechnique = this._activeTechnique;
//         // var passes = activeTechnique.passes;
//         // var numPasses = passes.length;
//         // var mask;
//         //
//         // if (activeTechnique.checkProperties)
//         // {
//         //     activeTechnique.checkProperties(this);
//         // }
//         //
//         // if (1 === numPasses)
//         // {
//         //     /* tslint:disable:no-bitwise */
//         //     mask = (passes[0].semanticsMask & attributeMask);
//         //     /* tslint:enable:no-bitwise */
//         //     if (mask !== this._clientStateMask)
//         //     {
//         //         this.enableClientState(mask);
//         //     }
//         //
//         //     gl.drawElements(primitive, numIndices, format, offset);
//         //
//         //     if (debug)
//         //     {
//         //         this.metrics.addPrimitives(primitive, numIndices);
//         //     }
//         // }
//         // else
//         // {
//         //     for (var p = 0; p < numPasses; p += 1)
//         //     {
//         //         var pass = passes[p];
//         //
//         //         /* tslint:disable:no-bitwise */
//         //         mask = (pass.semanticsMask & attributeMask);
//         //         /* tslint:enable:no-bitwise */
//         //         if (mask !== this._clientStateMask)
//         //         {
//         //             this.enableClientState(mask);
//         //         }
//         //
//         //         this.setPass(pass);
//         //
//         //         gl.drawElements(primitive, numIndices, format, offset);
//         //
//         //         if (debug)
//         //         {
//         //             this.metrics.addPrimitives(primitive, numIndices);
//         //         }
//         //     }
//         // }
//     }
//
//
// }