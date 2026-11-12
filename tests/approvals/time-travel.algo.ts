import type { bytes, uint64, Account, Application, Asset } from '@algorandfoundation/algorand-typescript'
import { assert, Box, Bytes, clone, Contract, contract, Global, GlobalState, op } from '@algorandfoundation/algorand-typescript'

/**
 * dt-algorand's time-travel ops, which only its POST /v2/query runs.
 *
 * The methods that read before a seek and use the value after it check that the optimizer keeps
 * reads on the side of the seek they were written on.
 */
type Point = { a: uint64; b: uint64 }

@contract({ name: 'TimeTravelContract', avmVersion: 13 })
export class TimeTravelContract extends Contract {
  counter = GlobalState<uint64>({ initialValue: 0 })
  data = Box<bytes>({ key: 'data' })
  items = Box<uint64[]>({ key: 'items' })
  point = Box<Point>({ key: 'pt' })

  roundAt(rnd: uint64): uint64 {
    op.TimeTravel.seek(rnd)
    return Global.round
  }

  roundBefore(rnd: uint64): uint64 {
    const before = Global.round
    op.TimeTravel.seek(rnd)
    return before
  }

  counterThenAndNow(rnd: uint64): [uint64, uint64] {
    // seeking to the round before the program's goes back to it
    const home: uint64 = Global.round - 1
    const now = this.counter.value
    op.TimeTravel.seek(rnd)
    const then = this.counter.value
    op.TimeTravel.seek(home)
    return [then, now]
  }

  dataChanged(rnd: uint64): boolean {
    const now = this.data.value
    op.TimeTravel.seek(rnd)
    const then = this.data.value
    return now.slice(0, 8) !== then.slice(0, 8)
  }

  firstItemChanged(rnd: uint64): boolean {
    const now = clone(this.items.value)
    goBack(rnd)
    const then = clone(this.items.value)
    return now[0] !== then[0]
  }

  firstItemNow(rnd: uint64): uint64 {
    const first = this.items.value[0]
    op.TimeTravel.seek(rnd)
    return first
  }

  appendThenWriteBack(rnd: uint64, x: uint64): void {
    const items = clone(this.items.value)
    items.push(x)
    op.TimeTravel.seek(rnd)
    this.items.value = clone(items)
  }

  setThenWriteBack(rnd: uint64, x: uint64): void {
    const point = clone(this.point.value)
    point.a = x
    op.TimeTravel.seek(rnd)
    this.point.value = clone(point)
  }

  timestamps(rnd: uint64, of: uint64): uint64 {
    const now = op.Block.blkTimestamp(of)
    op.TimeTravel.seek(rnd)
    const then = op.Block.blkTimestamp(of)
    return now + then
  }

  dataExisted(rnd: uint64): bytes {
    const existed = this.data.exists
    op.TimeTravel.seek(rnd)
    const then = this.data.value
    assert(existed)
    return then
  }

  dataExistsThen(rnd: uint64): boolean {
    assert(this.data.length)
    op.TimeTravel.seek(rnd)
    return this.data.exists
  }

  changes(acct: Account, asset: Asset, app: Application, from: uint64, to: uint64): uint64 {
    let total: uint64 = 0
    let [rnd, status] = op.TimeTravel.acctChange(acct, from, to)
    total += rnd + status
    ;[rnd, status] = op.TimeTravel.holdingChange(acct, asset, from, to)
    total += rnd + status
    ;[rnd, status] = op.TimeTravel.localChange(acct, app, from, to)
    total += rnd + status
    ;[rnd, status] = op.TimeTravel.assetChange(asset, from, to)
    total += rnd + status
    ;[rnd, status] = op.TimeTravel.appChange(app, from, to)
    total += rnd + status
    ;[rnd, status] = op.TimeTravel.boxChange(app, Bytes('data'), from, to)
    total += rnd + status
    const [gRnd, gStatus, gValue] = op.TimeTravel.globalKeyChangeUint64(app, Bytes('counter'), from, to)
    total += gRnd + gStatus + gValue
    const [nRnd, nStatus, nName] = op.TimeTravel.globalKeyChangeBytes(app, Bytes('name'), from, to)
    total += nRnd + nStatus + nName.length
    const [lRnd, lStatus, lValue] = op.TimeTravel.localKeyChangeUint64(acct, app, Bytes('n'), from, to)
    total += lRnd + lStatus + lValue
    const [sRnd, sStatus, sValue] = op.TimeTravel.localKeyChangeBytes(acct, app, Bytes('s'), from, to)
    total += sRnd + sStatus + sValue.length
    const [pRnd, pStatus, pName] = op.TimeTravel.boxPrefixChange(app, Bytes('it'), from, to)
    total += pRnd + pStatus + pName.length
    return total
  }
}

function goBack(rnd: uint64): void {
  op.TimeTravel.seek(rnd)
}
