// Javascript Bytestream object
// Takes an input of an unsigned 8bit integer array
// Allows seeking and bit-by-bit reading

class ByteStream {
    constructor (array) 
    {
        if(array instanceof Uint8Array) {
            this.bytes = array;
            this.currentByte = new Uint8Array([this.bytes]);
            this.position = 0;
            this.end = this.bytes.length;
            this.currentBit = 7;
        } else {
            throw new Error("Attempted to initialize a byte stream with an invalid argument.");
        }
    }

    // Reads a single byte from the stream, incrementing our position
    // If we're at the end of the stream, sets out currentbyte to null
    read () 
    {
        if(this.position < this.end) {
            this.currentByte[0] = this.bytes[this.position++];
            return this.currentByte[0];
        } else {
            return (this.currentByte = null);
        }
    }

    // Move our position in the stream to the supplied index
    seek (index) 
    {
        if(index >= 0 && index <= this.end) {
            this.currentByte = new Uint8Array([this.bytes[index]]);
            this.position = index;
            this.currentBit = 7;
        } else {
            this.position = this.end;
            throw new Error("Attempted to seek to an invalid position in a byte stream");
        }
    }

    // Read a single byte from the stream, maintaining our bit alignment
    readByte () 
    {
        // If we're aligned with a full byte
        if(this.currentBit === 7) {
            return this.read();
        }

        // Otherwise assemble from 8 bits
        let bits = this.readBits(8);
        if(this.bytedebug) console.log(bits);
        
        return bits.reduce((byte, bit) => 
        {
            if (bit === -1) throw new Error("Unexpected end of stream while reading off-alignment byte");
            return byte = (byte << 1) | bit;
        });
    }

    // Read multiple bytes in a stream, return it as an array
    readBytes (amount)
    {
        // If we're reading  more than we actually can, 
        // we only read the remaining bytes.
        if ((amount + this.loc) > this.end) amount = this.end - this.loc;
        
        let bytes = new Uint8Array(amount);
        for(let i = 0; i < amount; ++i) {
            let byte = this.readByte();
            if(byte === null) {
                break;
            } else {
                bytes[i] = byte;
            }
        }
        return bytes;
    }

    // Read a single bit from the stream
    readBit (reverse = false)
    {
        // If we're reading the 8th bit:
        // Check if we're at the end of the stream
        // Otherwise, set our current bit to 0
        if(this.currentBit > 6) {
            this.read();
            if(this.currentByte === null) {
                return -1;
            } else {
                this.currentBit = 0;
            }
        } else {
            ++this.currentBit;
        }

        // Bit shift the current byte to the left
        // according to our current bit, then masked
        // for the right-most bit
        if(reverse) {
            return (this.currentByte[0] >> this.currentBit) & 1;
        } else {
            return (this.currentByte[0] >> (7 - this.currentBit)) & 1;
        }
    }

    // Read multiple bits from the stream, then
    // return them as an array.
    readBits (amount, reverse = false) 
    {
        // Calculate the remaining bits by finding the difference
        // between our remaining bytes and our remaining bits
        let remainingBits = ((this.end - this.loc) * 8) - (7 - this.currentBit);
        if(amount > remainingBits) {
            amount = remainingBits;
        }

        let bits = [];
        for(let i = 0; i < amount; ++i) {
            bits.push(this.readBit(reverse));
        }

        return bits;
    }

    // Just to make reading different datatypes easier
    readAndAssembleBytes(amount)
    {
        let bytes = this.readBytes(amount);

        // If our byte array is null terminated, something went wrong
        if(bytes.length !== amount) {
            throw new Error("Unexpected end of stream while trying to assemble bytes");
        } else {

            return bytes.reduce((number, byte, index) => 
            {
                return number |= byte << (8 * index);
            });

        }
    }

    // Self explanatory
    readWord() 
    {
        return this.readAndAssembleBytes(2);
    }
    readSignedInt()
    {
        return this.readAndAssembleBytes(4);
    }

    // Finds the first occurrence of a pattern (given as an array)
    // within the stream, then returns the starting index.
    // Null items in the array are skipped over as free matches
    findPattern(pattern, start=0, end=this.end) 
    {

        let firstItem = pattern[0];
        // console.log(firstItem);
        for(let i = start; i < end; ++i) {
            // When we find our item, peek through the adjacent bytes for a match
            if(this.bytes[i] === firstItem) {
                let matches = pattern.reduce((matches, item, index) => 
                {
                    // console.log(index);
                    if(this.bytes[i + index] === item || item === null) {
                        return ++matches;
                    } else {
                        return matches;
                    }
                }, 0);

                if (matches === pattern.length) return i;
            }
        }
        // If we can't find the index, we return -1
        return -1;
    }

    findAllPattern(pattern)
    {
        let offset = 0;
        let start = 0;
        let occurrences = [];
        while ( (offset = this.findPattern(pattern, start)) !== -1) {
            occurrences.push(offset);
            start = offset + pattern.length;
        }

        return occurrences;
    }
}

export default ByteStream;