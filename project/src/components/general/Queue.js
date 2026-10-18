export class Queue {
    arr = [];
    pending = [];
    maxLength;
    maxPendingLength;
    constructor(maxLength,maxPendingLength) {
        this.maxLength = maxLength;
        this.maxPendingLength=maxPendingLength;
    }
    add(key,func) {
        if(this.arr.includes(key))return
        if(this.arr.length < this.maxLength){
            this.arr.push(key);
            func()
            return
        }
        this.#addPending(key,func);
    }
    #addPending(key,func) {
        if(this.pending.find((v)=>v.key === key))return
        if(this.pending.length >= this.maxPendingLength)this.pending.shift()
        this.pending.push({
            key,func
        });
    }
    getItem(index) {
        return this.arr[index];
    }
    removeItem(item) {
        let index=this.arr.indexOf(item)
        if(index==-1)return
        this.arr.splice(index, 1);
        if(this.pending.length>0){
            let p=this.pending.shift()
            p.func();
            this.arr.push(p.key);
        }
        
    }
    getAndRemoveItem(index) {
        let item = this.getItem(index);
        this.removeItem(index);
        return item;
    }
}
