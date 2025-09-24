export class Stack {
    constructor() {
        this.matrixStack = [];
    }

    // Adds the matrix to the stack
    pushMatrix(matrix) {
        let copyToPush = new Matrix4(matrix);
        this.matrixStack.push(copyToPush);
    }

    // Removes top element from the stack
    popMatrix() {
        if (this.matrixStack.length == 0)
            throw new Error ('Error in popMatrix, the stack is empty.');;
        this.matrixStack.pop();
    }

    // Read and return top
    peekMatrix() {
        if (this.matrixStack.length == 0)
            throw new Error ('Error in peekMatrix, the stack is empty.');
        let matrix = new Matrix4(this.matrixStack[this.matrixStack.length - 1]);
        return matrix;
    }

    empty() {
        this.matrixStack = [];
    }
}
