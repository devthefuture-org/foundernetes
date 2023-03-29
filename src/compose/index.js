module.exports = async ({ loadersFactory, playsFactory }) => {
  const factories = {
    loaders: loadersFactory.factories,
    plays: playsFactory.factories,
  }
  const loaders = await loadersFactory({
    factories,
  })
  const plays = await playsFactory({
    loaders,
    factories,
  })
  return { loaders, plays }
}
